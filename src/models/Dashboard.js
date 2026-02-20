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

const Dashboard = {
  getSummary: async (retries = 3) => {
    const now = new Date();
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
        const [
            [prevMonthRevenue],
            [activeSubscriptions],
            [userRows],
            [inactiveRows],
            [overdueRows],
            [expiredRows],
            [newClientsWeek],
            [newClientsMonth],
            [totalBookings],
            [pendingBookings],
            [pendingTickets],
            [pendingTasks],
            [inventoryValue],
            [inStockCount],
            [outStockCount],
            [revenueData],
            [packagePopularity],
            [staffOnDuty],
            [recentInvoices],
            [upcomingInstallations],
            [monthlyExpenditure],
            [monthlySubscriptionRevenue],
            [monthlySalesRevenue],
            [totalStaffSalaries],
            [subscriptionProjection]
        ] = await Promise.all([
            db.query(`
                SELECT COALESCE(SUM(amount), 0) as revenue FROM payments 
                WHERE status = 'paid' AND MONTH(payment_date) = ? AND YEAR(payment_date) = ?
            `, [previousMonth, previousYear]),

            db.query(`
                SELECT COUNT(DISTINCT user_id) as count FROM user_subscriptions 
                WHERE expiry_date > ?
            `, [nowTimestamp]),

            db.query(`SELECT COUNT(*) as count FROM users`),

            db.query(`
                SELECT COUNT(u.id) as count FROM users u
                LEFT JOIN user_subscriptions s ON u.id = s.user_id
                WHERE s.id IS NULL
            `),

            db.query(`
                SELECT COUNT(DISTINCT user_id) AS count FROM user_subscriptions
                WHERE TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5 AND expiry_date > ?
            `, [nowTimestamp, nowTimestamp]),

            db.query(`
                SELECT COUNT(DISTINCT user_id) as count FROM user_subscriptions 
                WHERE expiry_date <= ?
            `, [nowTimestamp]),

            db.query(`
                SELECT COUNT(*) as count FROM users 
                WHERE created_at BETWEEN ? AND ? AND is_active = TRUE
            `, [weekStart, weekEnd]),

            db.query(`
                SELECT COUNT(*) as count FROM users 
                WHERE created_at BETWEEN ? AND ? AND is_active = TRUE
            `, [monthStart, monthEnd]),

            db.query(`SELECT COUNT(*) as count FROM bookings`),

            db.query(`SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'`),

            db.query(`
                SELECT COUNT(*) as count FROM support_tickets 
                WHERE status IN ('open', 'pending') AND is_archived = FALSE
            `),

            db.query(`
                SELECT COUNT(*) as count FROM assignments 
                WHERE status IN ('pending', 'seen')
            `),

            db.query(`SELECT SUM(unit_price) as total_value FROM items WHERE status = 'in-stock'`),

            db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'in-stock'`),

            db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'out-stock'`),

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

            db.query(`
                SELECT p.name as package_name, p.id as package_id,
                COUNT(us.id) as subscription_count, p.price, p.speed
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.expiry_date > ?
                GROUP BY p.id, p.name, p.price, p.speed
                ORDER BY subscription_count DESC LIMIT 5
            `, [todayStart]),

            db.query(`
                SELECT COUNT(DISTINCT staff_id) as count FROM staff_attendance 
                WHERE DATE(attendance_date) = DATE(?) AND status = 'present'
            `, [todayStart]),

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

            db.query(`
                SELECT b.id, b.name as client_name, b.phone,
                b.packageId as package_name, b.location
                FROM bookings b WHERE b.status = 'pending' LIMIT 5
            `),

            db.query(`
                SELECT COALESCE(SUM(amount), 0) as monthlyTotal FROM hrexpenses
                WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?
            `, [currentMonth, currentYear]),

            db.query(`
                SELECT COALESCE(SUM(p.price), 0) as subscriptionTotal
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE YEAR(us.created_at) = YEAR(?) AND MONTH(us.created_at) = MONTH(?)
            `, [nowTimestamp, nowTimestamp]),

            db.query(`
                SELECT COALESCE(SUM(total_amount), 0) as monthlyTotal FROM sales
                WHERE MONTH(sold_date) = ? AND YEAR(sold_date) = ?
                AND payment_status IN ('paid', 'partial')
            `, [currentMonth, currentYear]),

            db.query(`SELECT COALESCE(SUM(basic_salary), 0) as total FROM staff_salaries`),

            db.query(`
                SELECT COALESCE(SUM(p.price), 0) as projected_revenue
                FROM user_subscriptions us
                JOIN packages p ON us.package_id = p.id
                WHERE us.start_date <= ? AND us.expiry_date > ?
                AND (
                    (YEAR(us.start_date) = ? AND MONTH(us.start_date) = ?)
                    OR (YEAR(us.expiry_date) = ? AND MONTH(us.expiry_date) = ?)
                    OR (us.start_date < ? AND us.expiry_date > ?)
                )
            `, [monthEnd, monthStart, currentYear, currentMonth, currentYear, currentMonth, monthStart, monthEnd])
        ]);

        // Calculate derived values
        const totalUsers = userRows[0].count;
        const inactiveUsers = inactiveRows[0].count;
        const overdueUsers = overdueRows[0].count;
        const expiredClients = expiredRows[0].count;
        const subscriptionRev = monthlySubscriptionRevenue[0]?.subscriptionTotal || 0;
        const salesRev = monthlySalesRevenue[0]?.monthlyTotal || 0;
        const currentRev = Number(subscriptionRev) + Number(salesRev);
        const prevRev = prevMonthRevenue[0]?.revenue || 0;
        const projectedRevenue = subscriptionProjection[0]?.projected_revenue || 0;

        let revenueTrend = 0;
        if (prevRev > 0) {
            revenueTrend = ((currentRev - prevRev) / prevRev) * 100;
        } else if (currentRev > 0) {
            revenueTrend = 100;
        }

        const projectionGrowth = currentRev > 0 
            ? ((projectedRevenue - currentRev) / currentRev) * 100 
            : 0;

        return {
            financial: {
                monthly_revenue: currentRev,
                monthly_subscription_revenue: subscriptionRev,
                monthly_sales_revenue: salesRev,
                monthly_expenditure: monthlyExpenditure[0]?.monthlyTotal || 0,
                revenue_trend: revenueTrend.toFixed(1),
                total_users: totalUsers,
                active_subscriptions: activeSubscriptions[0]?.count || 0,
                inactive_users: inactiveUsers,
                overdue_users: overdueUsers,
                expired_users: expiredClients,
                new_clients_week: newClientsWeek[0]?.count || 0,
                new_clients_month: newClientsMonth[0]?.count || 0,
                total_bookings: totalBookings[0]?.count || 0,
                pending_bookings: pendingBookings[0]?.count || 0,
                pending_tickets: pendingTickets[0]?.count || 0,
                pending_tasks: pendingTasks[0]?.count || 0,
                inventory_value: inventoryValue[0]?.total_value || 0,
                staff_salaries_payable: totalStaffSalaries[0]?.total || 0,
                in_stock_count: inStockCount[0]?.count || 0,
                out_stock_count: outStockCount[0]?.count || 0,
                staff_on_duty: staffOnDuty[0]?.count || 0,
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
    const today = toSqlDatetime(new Date());
    const sevenDaysOut = toSqlDatetime(dayjs().add(7, 'day').toDate());

    try {
      const [activeStaff] = await db.query(`SELECT COUNT(*) as count FROM staff WHERE is_active = TRUE`);
      const [availableEquipment] = await db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'available'`);
      
      const [monthlyExpenses] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as amount
        FROM expenses 
        WHERE MONTH(expense_date) = MONTH(?)
          AND YEAR(expense_date) = YEAR(?)
      `, [today, today]);

      const [renewalsDue] = await db.query(`
        SELECT COUNT(*) as count
        FROM user_subscriptions 
        WHERE status = 'active'
          AND expiry_date BETWEEN ? AND ?
      `, [today, sevenDaysOut]);

      return {
        active_staff: activeStaff[0]?.count || 0,
        available_equipment: availableEquipment[0]?.count || 0,
        monthly_expenses: monthlyExpenses[0]?.amount || 0,
        renewals_due: renewalsDue[0]?.count || 0
      };
    } catch (error) {
      console.error("Expanded metrics error:", error);
      throw error;
    }
  },

  getInventoryStatus: async () => {
    const sevenDaysAgo = toSqlDatetime(dayjs().subtract(7, 'day').toDate());

    try {
      // Remove the quantity-based queries since items table uses status field
      const [lowStock] = await db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'low-stock'`);
      const [outOfStock] = await db.query(`SELECT COUNT(*) as count FROM items WHERE status = 'out-stock'`);
      
      // Updated query - remove quantity multiplication since quantity column doesn't exist
      const [totalValue] = await db.query(`
        SELECT COUNT(*) as total_items, COALESCE(SUM(unit_price), 0) as total_value 
        FROM items
      `);
      
      const [recentItems] = await db.query(`SELECT COUNT(*) as count FROM items WHERE created_at >= ?`, [sevenDaysAgo]);

      const [itemsByCategory] = await db.query(`
        SELECT category, COUNT(*) as item_count
        FROM items 
        GROUP BY category 
        ORDER BY item_count DESC 
        LIMIT 5
      `);

      return {
        low_stock: lowStock[0]?.count || 0,
        out_of_stock: outOfStock[0]?.count || 0,
        inventory_value: totalValue[0]?.total_value || 0,
        total_items: totalValue[0]?.total_items || 0,
        recent_items: recentItems[0]?.count || 0,
        by_category: itemsByCategory
      };
    } catch (error) {
      console.error("Inventory status error:", error);
      throw error;
    }
  }
};

module.exports = Dashboard;