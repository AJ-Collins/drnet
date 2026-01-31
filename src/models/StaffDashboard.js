const db = require("../config/db");

// Helper to format JS Date to SQL DateTime string (YYYY-MM-DD HH:MM:SS)
const toSqlDatetime = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
        `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const StaffDashboard = {
  // Get all summary stats for the dashboard cards
  getDashboardStats: async (staffId) => {
    try {
      // 1. EARNINGS: Get latest net salary + total paid commissions
      const [salaryRows] = await db.query(
        `SELECT basic_salary FROM staff_salaries WHERE staff_id = ? ORDER BY id DESC LIMIT 1`,
        [staffId]
      );
      const [commRows] = await db.query(
        `SELECT SUM(amount) as total_comm FROM onboard_commissions WHERE staff_id = ?`,
        [staffId]
      );

      const basicSalary = salaryRows.length > 0 ? parseFloat(salaryRows[0].basic_salary) : 0;
      const totalCommission = commRows[0].total_comm ? parseFloat(commRows[0].total_comm) : 0;

      // 2. TASKS: Assignments breakdown
      const [taskRows] = await db.query(
        `SELECT 
          (SELECT COUNT(*) FROM assignments WHERE staff_id = ?) + 
          (SELECT COUNT(*) FROM ticket_assignments WHERE staff_id = ?) as total,
          
          (SELECT COUNT(*) FROM assignments WHERE staff_id = ? AND status = 'completed') + 
          (SELECT COUNT(*) FROM ticket_assignments WHERE staff_id = ? AND status = 'completed') as completed,
          
          (SELECT COUNT(*) FROM assignments WHERE staff_id = ? AND status = 'pending') + 
          (SELECT COUNT(*) FROM ticket_assignments WHERE staff_id = ? AND status = 'active') as pending`,
        [staffId, staffId, staffId, staffId, staffId, staffId]
      );

      // 3. ONBOARDS: Client breakdown
      const [clientRows] = await db.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
         FROM client_onboard WHERE staff_id = ?`,
        [staffId]
      );

      return {
        earnings: {
          salary: basicSalary,
          commission: totalCommission,
          total: totalCommission
        },
        tasks: taskRows[0],
        onboards: clientRows[0]
      };
    } catch (error) {
      console.error("Model Error (getDashboardStats):", error);
      throw error;
    }
  },

  // Get historical performance data for the chart (Last 6 Months)
  getPerformanceMetrics: async (staffId) => {
    try {
      const currentDate = toSqlDatetime(new Date());

      const sql = `
        SELECT * FROM (
          SELECT 
            DATE_FORMAT(d.day_date, '%d %b') as day_label,
            (
              (SELECT COUNT(*) FROM assignments WHERE staff_id = ? AND status = 'completed' AND DATE(assigned_at) = DATE(d.day_date)) +
              (SELECT COUNT(*) FROM ticket_assignments WHERE staff_id = ? AND status = 'completed' AND DATE(assigned_at) = DATE(d.day_date))
            ) as tasks_completed,

            (SELECT COUNT(*) FROM client_onboard WHERE staff_id = ? AND status = 'active' AND DATE(created_at) = DATE(d.day_date)) as clients_onboarded,

            (SELECT COUNT(*) FROM staff_attendance WHERE staff_id = ? AND status = 'present' AND DATE(attendance_date) = DATE(d.day_date)) as days_present

          FROM (
            SELECT DATE(?) - INTERVAL (a.a + (10 * b.a)) DAY as day_date
            FROM (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) as a
            CROSS JOIN (SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2) as b
          ) as d
          WHERE d.day_date <= DATE(?)
        ) AS activity_stats
        WHERE tasks_completed > 0 OR clients_onboarded > 0 OR days_present > 0
        ORDER BY STR_TO_DATE(day_label, '%d %b') ASC;
      `;

      const [rows] = await db.query(sql, [staffId, staffId, staffId, staffId, currentDate, currentDate]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getPayslips: async (staffId) => {
      try {
          const [rows] = await db.query(
              `SELECT id, pay_period, net_pay, payment_date 
              FROM staff_payslips 
              WHERE staff_id = ? 
              ORDER BY payment_date DESC LIMIT 5`,
              [staffId]
          );
          return rows;
      } catch (error) {
          console.error("Error fetching payslips:", error);
          throw error;
      }
  }
};

module.exports = StaffDashboard;