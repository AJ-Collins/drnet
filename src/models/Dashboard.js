const db = require("../config/db");
const dayjs = require("dayjs");

const Dashboard = {
  // Get all dashboard statistics
  getSummary: async () => {
    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
    const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

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

      // 3. Active subscribers (users with active subscriptions)
      const [activeSubscriptions] = await db.query(`
        SELECT COUNT(DISTINCT us.user_id) as count
        FROM user_subscriptions us
        JOIN users u ON us.user_id = u.id
        WHERE us.status = 'active' 
          AND us.expiry_date >= CURDATE()
          AND u.is_active = TRUE
      `);

      // 4. New clients this week (users created in current week)
      const [newClientsWeek] = await db.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE created_at BETWEEN ? AND ?
          AND is_active = TRUE
      `, [weekStart, weekEnd]);

      // 5. New clients this month
      const [newClientsMonth] = await db.query(`
        SELECT COUNT(*) as count
        FROM users 
        WHERE created_at BETWEEN ? AND ?
          AND is_active = TRUE
      `, [monthStart, monthEnd]);

      // 6. Pending bookings (installations)
      const [pendingBookings] = await db.query(`
        SELECT COUNT(*) as count
        FROM bookings 
        WHERE status = 'pending'
          AND installation_date >= CURDATE()
      `);

      // 7. Pending support tickets
      const [pendingTickets] = await db.query(`
        SELECT COUNT(*) as count
        FROM support_tickets 
        WHERE status IN ('open', 'in_progress')
      `);

      // 8. Recent revenue data for chart (last 6 months)
      const [revenueData] = await db.query(`
        SELECT 
          DATE_FORMAT(payment_date, '%Y-%m') as month,
          DATE_FORMAT(payment_date, '%b') as month_name,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments 
        WHERE status = 'paid'
          AND payment_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(payment_date, '%Y-%m'), DATE_FORMAT(payment_date, '%b')
        ORDER BY DATE_FORMAT(payment_date, '%Y-%m')
      `);

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
        WHERE us.status = 'active'
          AND us.expiry_date >= CURDATE()
        GROUP BY p.id, p.name, p.price, p.speed
        ORDER BY subscription_count DESC
        LIMIT 5
      `);

      // 10. Staff on duty today
      const [staffOnDuty] = await db.query(`
        SELECT COUNT(DISTINCT staff_id) as count
        FROM staff_attendance 
        WHERE DATE(attendance_date) = CURDATE()
          AND status = 'present'
      `);

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
          b.installation_date,
          b.package as package_name,
          b.location
        FROM bookings b
        WHERE b.status = 'pending'
          AND b.installation_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)
        ORDER BY b.installation_date ASC
        LIMIT 5
      `);

      // Calculate revenue trend percentage
      const currentRev = monthlyRevenue[0]?.revenue || 0;
      const prevRev = prevMonthRevenue[0]?.revenue || 0;
      let revenueTrend = 0;
      if (prevRev > 0) {
        revenueTrend = ((currentRev - prevRev) / prevRev) * 100;
      } else if (currentRev > 0) {
        revenueTrend = 100; // First month with revenue
      }

      return {
        financial: {
          monthly_revenue: currentRev,
          revenue_trend: revenueTrend.toFixed(1),
          active_subscriptions: activeSubscriptions[0]?.count || 0,
          new_clients_week: newClientsWeek[0]?.count || 0,
          new_clients_month: newClientsMonth[0]?.count || 0,
          pending_bookings: pendingBookings[0]?.count || 0,
          pending_tickets: pendingTickets[0]?.count || 0,
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

  // Get additional metrics for expanded view
  getExpandedMetrics: async () => {
    try {
      // Total active staff
      const [activeStaff] = await db.query(`
        SELECT COUNT(*) as count FROM staff WHERE is_active = TRUE
      `);

      // Total available equipment
      const [availableEquipment] = await db.query(`
        SELECT COUNT(*) as count FROM items WHERE status = 'available'
      `);

      // Monthly expenses
      const [monthlyExpenses] = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as amount
        FROM expenses 
        WHERE MONTH(expense_date) = MONTH(CURDATE())
          AND YEAR(expense_date) = YEAR(CURDATE())
      `);

      // Renewals due this week
      const [renewalsDue] = await db.query(`
        SELECT COUNT(*) as count
        FROM user_subscriptions 
        WHERE status = 'active'
          AND expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      `);

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

  // Get performance comparison (current vs previous period)
  getPerformanceComparison: async () => {
    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    try {
      const [comparison] = await db.query(`
        SELECT 
          'current' as period,
          COUNT(DISTINCT CASE WHEN us.status = 'active' AND us.expiry_date >= CURDATE() THEN us.user_id END) as active_subs,
          COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount END), 0) as revenue,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_installs,
          COUNT(DISTINCT CASE WHEN s.is_active = TRUE THEN s.id END) as active_staff
        FROM (SELECT ? as month, ? as year) as dates
        
        LEFT JOIN user_subscriptions us ON MONTH(us.start_date) = dates.month AND YEAR(us.start_date) = dates.year
        LEFT JOIN payments p ON MONTH(p.payment_date) = dates.month AND YEAR(p.payment_date) = dates.year
        LEFT JOIN bookings b ON MONTH(b.installation_date) = dates.month AND YEAR(b.installation_date) = dates.year
        LEFT JOIN staff s ON MONTH(s.hire_date) = dates.month AND YEAR(s.hire_date) = dates.year
        
        UNION ALL
        
        SELECT 
          'previous' as period,
          COUNT(DISTINCT CASE WHEN us.status = 'active' AND us.expiry_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) THEN us.user_id END) as active_subs,
          COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount END), 0) as revenue,
          COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END) as completed_installs,
          COUNT(DISTINCT CASE WHEN s.is_active = TRUE THEN s.id END) as active_staff
        FROM (SELECT ? as month, ? as year) as dates
        
        LEFT JOIN user_subscriptions us ON MONTH(us.start_date) = dates.month AND YEAR(us.start_date) = dates.year
        LEFT JOIN payments p ON MONTH(p.payment_date) = dates.month AND YEAR(p.payment_date) = dates.year
        LEFT JOIN bookings b ON MONTH(b.installation_date) = dates.month AND YEAR(b.installation_date) = dates.year
        LEFT JOIN staff s ON MONTH(s.hire_date) = dates.month AND YEAR(s.hire_date) = dates.year
      `, [currentMonth, currentYear, previousMonth, previousYear]);

      return comparison;
    } catch (error) {
      console.error("Performance comparison error:", error);
      throw error;
    }
  }
};

module.exports = Dashboard;