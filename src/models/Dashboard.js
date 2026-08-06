const db = require("../config/db");
const dayjs = require("dayjs");

/**
 * Helper to convert JS Date objects to MySQL DATETIME strings
 * Format: YYYY-MM-DD HH:mm:ss
 */
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

// In-memory cache for Dashboard Data (TTL: 30 seconds)
let dashboardCache = {
    summary: { data: null, timestamp: 0 },
    expanded: { data: null, timestamp: 0 },
    inventory: { data: null, timestamp: 0 }
};
const CACHE_TTL = 30 * 1000;

const Dashboard = {
  getSummary: async (retries = 3) => {
    const now = new Date();
    
    // Return cached data if valid
    if (dashboardCache.summary.data && (now.getTime() - dashboardCache.summary.timestamp < CACHE_TTL)) {
        return dashboardCache.summary.data;
    }

    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonthDate = dayjs().subtract(1, 'month').toDate();
    const previousMonth = lastMonthDate.getMonth() + 1;
    const previousYear = lastMonthDate.getFullYear();
    const todayStart = toSqlDatetime(dayjs().startOf('day').toDate());
    const weekStart = toSqlDatetime(dayjs().startOf('week').toDate());
    const weekEnd = toSqlDatetime(dayjs().endOf('week').toDate());
    const monthStart = toSqlDatetime(dayjs().startOf('month').toDate());
    const monthEnd = toSqlDatetime(dayjs().endOf('month').toDate());
    const threeDaysOut = toSqlDatetime(dayjs().add(3, 'day').endOf('day').toDate());
    const nowTimestamp = toSqlDatetime(new Date());

    try {
        // promise run all queries
        // 1. Consolidated Metrics Query
        const metricsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE expiry_date > ?) as active_subscriptions,
                (SELECT COUNT(u.id) FROM users u LEFT JOIN user_subscriptions s ON u.id = s.user_id WHERE s.id IS NULL) as inactive_users,
                (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5 AND expiry_date > ?) as overdue_users,
                (SELECT COUNT(DISTINCT user_id) FROM user_subscriptions WHERE expiry_date <= ?) as expired_users,
                (SELECT COUNT(*) FROM users WHERE created_at BETWEEN ? AND ? AND is_active = TRUE) as new_clients_week,
                (SELECT COUNT(*) FROM users WHERE created_at BETWEEN ? AND ? AND is_active = TRUE) as new_clients_month,
                (SELECT COUNT(*) FROM bookings) as total_bookings,
                (SELECT COUNT(*) FROM bookings WHERE status = 'pending') as pending_bookings,
                (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'pending') AND is_archived = FALSE) as pending_tickets,
                (SELECT COUNT(*) FROM assignments WHERE status IN ('pending', 'seen')) as pending_tasks,
                (SELECT SUM(unit_price) FROM items WHERE status = 'in-stock') as inventory_value,
                (SELECT COUNT(*) FROM items WHERE status = 'in-stock') as in_stock_count,
                (SELECT COUNT(*) FROM items WHERE status = 'out-stock') as out_stock_count,
                (SELECT COUNT(DISTINCT staff_id) FROM staff_attendance WHERE DATE(attendance_date) = DATE(?) AND status = 'present') as staff_on_duty,
                (SELECT COALESCE(SUM(basic_salary), 0) FROM staff_salaries) as total_staff_salaries
        `;
        const metricsParams = [
            nowTimestamp, nowTimestamp, nowTimestamp, nowTimestamp, 
            weekStart, weekEnd, monthStart, monthEnd, todayStart
        ];

        // 2. Consolidated Financials Query
        const financialsQuery = `
            SELECT 
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'paid' AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?) as prev_month_revenue,
                (SELECT COALESCE(SUM(amount), 0) FROM hrexpenses WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?) as monthly_expenditure,
                (SELECT COALESCE(SUM(p.price), 0) FROM user_subscriptions us JOIN packages p ON us.package_id = p.id WHERE YEAR(us.created_at) = YEAR(?) AND MONTH(us.created_at) = MONTH(?)) as monthly_subscription_revenue,
                (SELECT COALESCE(SUM(total_amount), 0) FROM sales WHERE MONTH(sold_date) = ? AND YEAR(sold_date) = ? AND payment_status IN ('paid', 'partial')) as monthly_sales_revenue,
                (SELECT COALESCE(SUM(p.price), 0) FROM user_subscriptions us JOIN packages p ON us.package_id = p.id WHERE us.start_date <= ? AND us.expiry_date > ? AND ((YEAR(us.start_date) = ? AND MONTH(us.start_date) = ?) OR (YEAR(us.expiry_date) = ? AND MONTH(us.expiry_date) = ?) OR (us.start_date < ? AND us.expiry_date > ?))) as projected_revenue
        `;
        const financialsParams = [
            previousMonth, previousYear,
            currentMonth, currentYear,
            nowTimestamp, nowTimestamp,
            currentMonth, currentYear,
            monthEnd, monthStart, currentYear, currentMonth, currentYear, currentMonth, monthStart, monthEnd
        ];

        const [
            [metricsResult],
            [financialsResult],
            [revenueData],
            [packagePopularity],
            [recentInvoices],
            [upcomingInstallations]
        ] = await Promise.all([
            db.query(metricsQuery, metricsParams),
            db.query(financialsQuery, financialsParams),

            // Revenue Data for Chart
            db.query(`
                SELECT DATE_FORMAT(all_dates.d, '%d %b') AS day_label,
                DAY(all_dates.d) AS day_num,
                COALESCE(payment_revenue, 0) as payment_revenue,
                COALESCE(sales_revenue, 0) as sales_revenue,
                COALESCE(payment_revenue, 0) + COALESCE(sales_revenue, 0) as total_revenue
                FROM (
                    SELECT DISTINCT DATE(payment_date) AS d FROM payments
                    WHERE status = 'paid' AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?
                    UNION
                    SELECT DISTINCT DATE(sold_date) AS d FROM sales
                    WHERE payment_status IN ('paid', 'partial') AND MONTH(sold_date) = ? AND YEAR(sold_date) = ?
                ) all_dates
                LEFT JOIN (
                    SELECT DATE(payment_date) AS d, SUM(amount) AS payment_revenue FROM payments
                    WHERE status = 'paid' AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?
                    GROUP BY DATE(payment_date)
                ) payments_data ON all_dates.d = payments_data.d
                LEFT JOIN (
                    SELECT DATE(sold_date) AS d, SUM(total_amount) AS sales_revenue FROM sales
                    WHERE payment_status IN ('paid', 'partial') AND MONTH(sold_date) = ? AND YEAR(sold_date) = ?
                    GROUP BY DATE(sold_date)
                ) sales_data ON all_dates.d = sales_data.d
                ORDER BY all_dates.d ASC
            `, [currentMonth, currentYear, currentMonth, currentYear, currentMonth, currentYear, currentMonth, currentYear]),

            // Package Popularity for Chart
            db.query(`
                SELECT p.name as package_name, p.id as package_id,
                COUNT(us.id) as subscription_count, p.price, p.speed
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.expiry_date > ?
                GROUP BY p.id, p.name, p.price, p.speed
                ORDER BY subscription_count DESC LIMIT 5
            `, [todayStart]),

            // Recent Invoices
            db.query(`
                SELECT p.id,
                CONCAT('INV-', DATE_FORMAT(p.payment_date, '%Y'), '-', LPAD(p.id, 4, '0')) as invoice_id,
                CONCAT(u.first_name, ' ', u.second_name) as client_name,
                p.amount, p.status,
                DATE_FORMAT(p.payment_date, '%Y-%m-%d') as payment_date,
                pa.name as package_name
                FROM payments p
                JOIN users u ON p.user_id = u.id
                LEFT JOIN user_subscriptions us ON p.subscription_id = us.id
                LEFT JOIN packages pa ON us.package_id = pa.id
                ORDER BY p.payment_date DESC LIMIT 5
            `),

            // Upcoming Installations (Bookings)
            db.query(`
                SELECT b.id, b.name as client_name, b.phone,
                b.packageId as package_name, b.location
                FROM bookings b WHERE b.status = 'pending' LIMIT 5
            `)
        ]);

        // Extract from first row of metricsResult
        const m = metricsResult[0];
        // Extract from first row of financialsResult
        const f = financialsResult[0];

        const subscriptionRev = Number(f.monthly_subscription_revenue || 0);
        const salesRev = Number(f.monthly_sales_revenue || 0);
        const currentRev = subscriptionRev + salesRev;
        const prevRev = Number(f.prev_month_revenue || 0);
        const projectedRevenue = Number(f.projected_revenue || 0);

        let revenueTrend = 0;
        if (prevRev > 0) {
            revenueTrend = ((currentRev - prevRev) / prevRev) * 100;
        } else if (currentRev > 0) {
            revenueTrend = 100;
        }

        const projectionGrowth = currentRev > 0 
            ? ((projectedRevenue - currentRev) / currentRev) * 100 
            : 0;

        const result = {
            financial: {
                monthly_revenue: currentRev,
                monthly_subscription_revenue: subscriptionRev,
                monthly_sales_revenue: salesRev,
                monthly_expenditure: Number(f.monthly_expenditure || 0),
                revenue_trend: revenueTrend.toFixed(1),
                total_users: m.total_users,
                active_subscriptions: m.active_subscriptions,
                inactive_users: m.inactive_users,
                overdue_users: m.overdue_users,
                expired_users: m.expired_users,
                new_clients_week: m.new_clients_week,
                new_clients_month: m.new_clients_month,
                total_bookings: m.total_bookings,
                pending_bookings: m.pending_bookings,
                pending_tickets: m.pending_tickets,
                pending_tasks: m.pending_tasks,
                inventory_value: m.inventory_value,
                staff_salaries_payable: m.total_staff_salaries,
                in_stock_count: m.in_stock_count,
                out_stock_count: m.out_stock_count,
                staff_on_duty: m.staff_on_duty,
                projected_revenue: projectedRevenue,
                projection_growth: projectionGrowth.toFixed(1)
            },
            charts: {
                monthlyRevenue: revenueData,
                packagePopularity: packagePopularity
            },
            recent: {
                invoices: recentInvoices,
                installations: upcomingInstallations
            }
        };

        dashboardCache.summary.data = result;
        dashboardCache.summary.timestamp = Date.now();
        return result;

      } catch (error) {
          if (retries > 0 && error.code === 'ECONNREFUSED') {
              console.warn(`DB retry... attempts left: ${retries}`);
              await new Promise(res => setTimeout(res, 500));
              return Dashboard.getSummary(retries - 1);
          }
          console.error("Dashboard summary error:", error);
          throw error;
      }
    },

  getExpandedMetrics: async () => {
    const nowTime = Date.now();
    if (dashboardCache.expanded.data && (nowTime - dashboardCache.expanded.timestamp < CACHE_TTL)) {
        return dashboardCache.expanded.data;
    }

    const today = toSqlDatetime(new Date());
    const sevenDaysOut = toSqlDatetime(dayjs().add(7, 'day').toDate());

    try {
      const query = `
        SELECT
          (SELECT COUNT(*) FROM staff WHERE is_active = TRUE) as active_staff,
          (SELECT COUNT(*) FROM items WHERE status = 'available') as available_equipment,
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE MONTH(expense_date) = MONTH(?) AND YEAR(expense_date) = YEAR(?)) as monthly_expenses,
          (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active' AND expiry_date BETWEEN ? AND ?) as renewals_due
      `;
      const params = [today, today, today, sevenDaysOut];
      
      const [[rows]] = await db.query(query, params);

      const result = {
        active_staff: rows.active_staff || 0,
        available_equipment: rows.available_equipment || 0,
        monthly_expenses: rows.monthly_expenses || 0,
        renewals_due: rows.renewals_due || 0
      };
      
      dashboardCache.expanded.data = result;
      dashboardCache.expanded.timestamp = Date.now();
      return result;
    } catch (error) {
      console.error("Expanded metrics error:", error);
      throw error;
    }
  },

  getInventoryStatus: async () => {
    const nowTime = Date.now();
    if (dashboardCache.inventory.data && (nowTime - dashboardCache.inventory.timestamp < CACHE_TTL)) {
        return dashboardCache.inventory.data;
    }

    const sevenDaysAgo = toSqlDatetime(dayjs().subtract(7, 'day').toDate());

    try {
      const query = `
        SELECT
          (SELECT COUNT(*) FROM items WHERE status = 'low-stock') as low_stock,
          (SELECT COUNT(*) FROM items WHERE status = 'out-stock') as out_of_stock,
          (SELECT COUNT(*) FROM items) as total_items,
          (SELECT COALESCE(SUM(unit_price), 0) FROM items) as total_value,
          (SELECT COUNT(*) FROM items WHERE created_at >= ?) as recent_items
      `;
      const [[rows]] = await db.query(query, [sevenDaysAgo]);

      const [itemsByCategory] = await db.query(`
        SELECT category, COUNT(*) as item_count
        FROM items 
        GROUP BY category 
        ORDER BY item_count DESC 
        LIMIT 5
      `);

      const result = {
        low_stock: rows.low_stock || 0,
        out_of_stock: rows.out_of_stock || 0,
        inventory_value: rows.total_value || 0,
        total_items: rows.total_items || 0,
        recent_items: rows.recent_items || 0,
        by_category: itemsByCategory
      };
      
      dashboardCache.inventory.data = result;
      dashboardCache.inventory.timestamp = Date.now();
      return result;
    } catch (error) {
      console.error("Inventory status error:", error);
      throw error;
    }
  }
};

module.exports = Dashboard;