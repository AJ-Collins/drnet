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
  getSummary: async () => {
    // Current Time Reference
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Previous Month Logic
    const lastMonthDate = dayjs().subtract(1, 'month').toDate();
    const previousMonth = lastMonthDate.getMonth() + 1;
    const previousYear = lastMonthDate.getFullYear();
    
    // Formatted Time Boundaries
    const todayStart = toSqlDatetime(dayjs().startOf('day').toDate());
    const weekStart = toSqlDatetime(dayjs().startOf('week').toDate());
    const weekEnd = toSqlDatetime(dayjs().endOf('week').toDate());
    const monthStart = toSqlDatetime(dayjs().startOf('month').toDate());
    const monthEnd = toSqlDatetime(dayjs().endOf('month').toDate());
    const threeDaysOut = toSqlDatetime(dayjs().add(3, 'day').endOf('day').toDate());
    const nowTimestamp = toSqlDatetime(new Date());

    try {
      // 1. Monthly Revenue from payments
      const [monthlyRevenue] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as revenue
        FROM payments 
        WHERE status = 'paid' 
          AND MONTH(payment_date) = ? 
          AND YEAR(payment_date) = ?
      `, [currentMonth, currentYear]);

      // 2. Previous month revenue for comparison
      const [prevMonthRevenue] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as revenue
        FROM payments 
        WHERE status = 'paid' 
          AND MONTH(payment_date) = ? 
          AND YEAR(payment_date) = ?
      `, [previousMonth, previousYear]);

      // 3. Active subscribers
      const [activeSubscriptions] = await db.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM user_subscriptions
        WHERE expiry_date > ?
      `, [nowTimestamp]);

      const [rows] = await db.query(`
        SELECT COUNT(*) as count
        FROM users
      `);
      const totalUsers = rows[0].count;

      const [inactiveRows] = await db.query(`
        SELECT COUNT(u.id) as count
        FROM users u
        LEFT JOIN user_subscriptions s ON u.id = s.user_id
        WHERE s.id IS NULL
      `);
      const inactiveUsers = inactiveRows[0].count;

      const [overdueRows] = await db.query(`
        SELECT COUNT(DISTINCT user_id) AS count
        FROM user_subscriptions
        WHERE TIMESTAMPDIFF(DAY, ?, expiry_date) <= 5
          AND expiry_date > ?
      `, [nowTimestamp, nowTimestamp]);

      const overdueUsers = overdueRows[0].count;

      const [expiredRows] = await db.query(`
          SELECT COUNT(DISTINCT user_id) as count
          FROM user_subscriptions
          WHERE expiry_date <= ?
      `, [nowTimestamp]);

      const expiredClients = expiredRows[0].count;

      const [newClientsWeek] = await db.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE created_at BETWEEN ? AND ?
          AND is_active = TRUE
      `, [weekStart, weekEnd]);

      const [newClientsMonth] = await db.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE created_at BETWEEN ? AND ?
          AND is_active = TRUE
      `, [monthStart, monthEnd]);

      const [pendingBookings] = await db.query(`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE status = 'pending'
      `);

      const [pendingTickets] = await db.query(`
        SELECT COUNT(*) as count
        FROM support_tickets 
        WHERE status = 'pending'
      `);

      const [inventoryValue] = await db.query(`
        SELECT SUM(unit_price) as total_value 
        FROM items 
        WHERE status = 'in-stock'
      `);

      const [inventorySalesValue] = await db.query(`
        SELECT SUM(total_amount) as total_sales 
        FROM sales 
        WHERE payment_status = 'paid'
      `);

      const [inStockCount] = await db.query(`
        SELECT COUNT(*) as count 
        FROM items 
        WHERE status = 'in-stock'
      `);

      const [outStockCount] = await db.query(`
        SELECT COUNT(*) as count 
        FROM items 
        WHERE status = 'out-stock'
      `);


      const [revenueData] = await db.query(`
        SELECT 
          DATE_FORMAT(payment_date, '%Y-%m') as month,
          DATE_FORMAT(payment_date, '%b %Y') as month_name,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments 
        WHERE status = 'paid'
          AND payment_date >= DATE_SUB(?, INTERVAL 12 MONTH)
        GROUP BY 1, 2
        ORDER BY 1 ASC
      `, [todayStart]);

      // 9. Package popularity
      const [packagePopularity] = await db.query(`
        SELECT 
          p.name as package_name,
          p.id as package_id,
          COUNT(us.id) as subscription_count,
          p.price,
          p.speed
        FROM user_subscriptions us
        JOIN packages p ON us.package_id = p.id
        WHERE us.expiry_date > ?
        GROUP BY p.id, p.name, p.price, p.speed
        ORDER BY subscription_count DESC
        LIMIT 5
      `, [todayStart]);

      // 10. Staff on duty today
      const [staffOnDuty] = await db.query(`
        SELECT COUNT(DISTINCT staff_id) as count
        FROM staff_attendance 
        WHERE DATE(attendance_date) = DATE(?)
          AND status = 'present'
      `, [todayStart]);

      // 11. Recent invoices/payments (last 5)
      const [recentInvoices] = await db.query(`
        SELECT 
          p.id,
          CONCAT('INV-', DATE_FORMAT(p.payment_date, '%Y'), '-', LPAD(p.id, 4, '0')) as invoice_id,
          CONCAT(u.first_name, ' ', u.second_name) as client_name,
          p.amount,
          p.status,
          DATE_FORMAT(p.payment_date, '%Y-%m-%d') as payment_date,
          pa.name as package_name
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN user_subscriptions us ON p.subscription_id = us.id
        LEFT JOIN packages pa ON us.package_id = pa.id
        ORDER BY p.payment_date DESC
        LIMIT 5
      `);

      // 12. Upcoming installations (next 3 days)
      const [upcomingInstallations] = await db.query(`
        SELECT 
          b.id,
          b.name as client_name,
          b.phone,
          b.packageId as package_name,
          b.location
        FROM bookings b
        WHERE b.status = 'pending'
        LIMIT 5
      `, [todayStart, threeDaysOut]);

      // Calculate revenue trend percentage
      const currentRev = monthlyRevenue[0]?.revenue || 0;
      const prevRev = prevMonthRevenue[0]?.revenue || 0;
      let revenueTrend = 0;
      if (prevRev > 0) {
        revenueTrend = ((currentRev - prevRev) / prevRev) * 100;
      } else if (currentRev > 0) {
        revenueTrend = 100;
      }

      return {
        financial: {
          monthly_revenue: currentRev,
          revenue_trend: revenueTrend.toFixed(1),
          total_users: totalUsers,
          active_subscriptions: activeSubscriptions[0]?.count || 0,
          inactive_users: inactiveUsers,
          overdue_users: overdueUsers,
          expired_users: expiredClients,
          new_clients_week: newClientsWeek[0]?.count || 0,
          new_clients_month: newClientsMonth[0]?.count || 0,
          pending_bookings: pendingBookings[0]?.count || 0,
          pending_tickets: pendingTickets[0]?.count || 0,
          inventory_value: inventoryValue[0]?.total_value || 0,
          inventory_sales_value: inventorySalesValue[0]?.total_sales || 0,
          in_stock_count: inStockCount[0]?.count || 0,
          out_stock_count: outStockCount[0]?.count || 0,
          staff_on_duty: staffOnDuty[0]?.count || 0
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
      const [lowStock] = await db.query(`SELECT COUNT(*) as count FROM items WHERE quantity < 10 AND quantity > 0`);
      const [outOfStock] = await db.query(`SELECT COUNT(*) as count FROM items WHERE quantity = 0`);
      const [totalValue] = await db.query(`
        SELECT COUNT(*) as total_items, COALESCE(SUM(quantity * unit_price), 0) as total_value FROM items
      `);
      
      const [recentItems] = await db.query(`SELECT COUNT(*) as count FROM items WHERE created_at >= ?`, [sevenDaysAgo]);

      const [itemsByCategory] = await db.query(`
        SELECT category, COUNT(*) as item_count, SUM(quantity) as total_quantity
        FROM items GROUP BY category ORDER BY item_count DESC LIMIT 5
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