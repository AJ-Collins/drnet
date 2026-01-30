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
        `SELECT net_salary FROM staff_salaries WHERE staff_id = ? ORDER BY id DESC LIMIT 1`,
        [staffId]
      );
      const [commRows] = await db.query(
        `SELECT SUM(amount) as total_comm FROM onboard_commissions WHERE staff_id = ? AND status = 'paid'`,
        [staffId]
      );

      const netSalary = salaryRows.length > 0 ? parseFloat(salaryRows[0].net_salary) : 0;
      const totalCommission = commRows[0].total_comm ? parseFloat(commRows[0].total_comm) : 0;

      // 2. TASKS: Assignments breakdown
      const [taskRows] = await db.query(
        `SELECT 
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM assignments WHERE staff_id = ?`,
        [staffId]
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
          salary: netSalary,
          commission: totalCommission,
          total: netSalary + totalCommission
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
      // Generate the current DateTime in SQL format using the helper
      const currentDate = toSqlDatetime(new Date());

      // This query generates a list of the last 6 months using the passed currentDate
      const sql = `
        SELECT 
          DATE_FORMAT(m.month_date, '%b') as month_name,
          
          -- Count Completed Tasks per month
          (SELECT COUNT(*) FROM assignments 
           WHERE staff_id = ? 
           AND status = 'completed' 
           AND DATE_FORMAT(assigned_at, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
          ) as tasks_completed,

          -- Count Active Onboards per month
          (SELECT COUNT(*) FROM client_onboard 
           WHERE staff_id = ? 
           AND status = 'active' 
           AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
          ) as clients_onboarded,

          -- Attendance Rate (Present days)
          (SELECT COUNT(*) FROM staff_attendance 
           WHERE staff_id = ? 
           AND status = 'present' 
           AND DATE_FORMAT(attendance_date, '%Y-%m') = DATE_FORMAT(m.month_date, '%Y-%m')
          ) as days_present

        FROM (
          SELECT ? - INTERVAL 0 MONTH as month_date
          UNION SELECT ? - INTERVAL 1 MONTH
          UNION SELECT ? - INTERVAL 2 MONTH
          UNION SELECT ? - INTERVAL 3 MONTH
          UNION SELECT ? - INTERVAL 4 MONTH
          UNION SELECT ? - INTERVAL 5 MONTH
        ) as m
        ORDER BY m.month_date ASC;
      `;

      const params = [
        staffId, staffId, staffId, 
        currentDate, currentDate, currentDate, currentDate, currentDate, currentDate
      ];

      const [rows] = await db.query(sql, params);
      return rows;
    } catch (error) {
      console.error("Model Error (getPerformanceMetrics):", error);
      throw error;
    }
  }
};

module.exports = StaffDashboard;