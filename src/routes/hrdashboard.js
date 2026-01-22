const express = require("express");
const router = express.Router();
const db = require("../config/db");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Dashboard summary endpoint
router.get("/dashboard/summary", async (req, res) => {
  try {
    // Get current month and date for calculations
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const today = currentDate.toISOString().split('T')[0];

    // 1. Expense Summary
    const [expenseResult] = await db.query(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total,
        SUM(CASE 
          WHEN MONTH(expense_date) = ? AND YEAR(expense_date) = ? 
          THEN amount ELSE 0 
        END) as monthlyTotal
      FROM hrexpenses
    `, [currentMonth, currentYear]);

    // 2. Booking Summary
    const [bookingResult] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('pending', 'completed') THEN 1 ELSE 0 END) as active
      FROM hrbookings
    `);

    // 3. Task Summary
    const [taskResult] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended
      FROM hrtasks
    `);

    // 4. Recent Communications
    const [commResult] = await db.query(`
      SELECT COUNT(*) as recent 
      FROM hrcommunicationlogs 
      WHERE DATE(sent_at) = ?
    `, [today]);

    // 5. Expense Breakdown for current month
    const [breakdownResult] = await db.query(`
      SELECT 
        category,
        SUM(amount) as amount
      FROM hrexpenses
      WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `, [currentMonth, currentYear]);

    // Calculate efficiency
    const totalTasks = taskResult[0]?.total || 0;
    const completedTasks = taskResult[0]?.completed || 0;
    const efficiency = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      expenses: {
        total: expenseResult[0]?.total || 0,
        count: expenseResult[0]?.count || 0,
        monthlyTotal: expenseResult[0]?.monthlyTotal || 0,
        breakdown: breakdownResult.map(item => ({
          category: item.category,
          amount: item.amount
        }))
      },
      bookings: {
        active: bookingResult[0]?.active || 0,
        total: bookingResult[0]?.total || 0
      },
      tasks: {
        pending: taskResult[0]?.pending || 0,
        completed: taskResult[0]?.completed || 0,
        suspended: taskResult[0]?.suspended || 0,
        total: totalTasks
      },
      communications: {
        recent: commResult[0]?.recent || 0
      },
      efficiency: efficiency
    });

  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// Expense breakdown by period
router.get("/dashboard/expenses/breakdown", async (req, res) => {
  try {
    const { period } = req.query;
    const currentDate = new Date();
    let dateCondition = "";

    switch (period) {
      case 'today':
        const today = currentDate.toISOString().split('T')[0];
        dateCondition = `DATE(expense_date) = '${today}'`;
        break;
      case 'week':
        const weekAgo = new Date(currentDate);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];
        dateCondition = `expense_date >= '${weekAgoStr}'`;
        break;
      case 'month':
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        dateCondition = `MONTH(expense_date) = ${month} AND YEAR(expense_date) = ${year}`;
        break;
      default: // 'all'
        dateCondition = "1=1";
    }

    const [result] = await db.query(`
      SELECT 
        category,
        SUM(amount) as amount
      FROM hrexpenses
      WHERE ${dateCondition}
      GROUP BY category
      ORDER BY amount DESC
    `);

    res.json(result.map(item => ({
      category: item.category,
      amount: item.amount || 0
    })));

  } catch (error) {
    console.error("Expense breakdown error:", error);
    res.status(500).json({ error: "Failed to load expense breakdown" });
  }
});

// Recent activities
router.get("/dashboard/recent/activities", async (req, res) => {
  try {
    const activities = [];

    // Get recent expenses
    const [expenses] = await db.query(`
      SELECT 
        id,
        CONCAT(category, ' - ', beneficiary) as description,
        amount,
        expense_date,
        'expense' as type
      FROM hrexpenses
      ORDER BY expense_date DESC
      LIMIT 3
    `);

    activities.push(...expenses.map(exp => ({
      type: exp.type,
      desc: exp.description,
      amount: `KES ${parseFloat(exp.amount).toLocaleString()}`,
      time: new Date(exp.expense_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      user: 'Finance'
    })));

    // Get recent bookings
    const [bookings] = await db.query(`
      SELECT 
        id,
        CONCAT('Booking: ', name) as description,
        date,
        'booking' as type
      FROM hrbookings
      ORDER BY date DESC
      LIMIT 3
    `);

    activities.push(...bookings.map(book => ({
      type: book.type,
      desc: book.description,
      time: new Date(book.date).toLocaleDateString(),
      user: 'Sales'
    })));

    // Get recent tasks
    const [tasks] = await db.query(`
      SELECT 
        id,
        description,
        task_date,
        'task' as type
      FROM hrtasks
      ORDER BY task_date DESC
      LIMIT 3
    `);

    activities.push(...tasks.map(task => ({
      type: task.type,
      desc: task.description,
      time: new Date(task.task_date).toLocaleDateString(),
      user: 'Operations'
    })));

    // Sort by date and limit to 8 most recent
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    res.json(activities.slice(0, 8));

  } catch (error) {
    console.error("Recent activities error:", error);
    res.status(500).json({ error: "Failed to load recent activities" });
  }
});

module.exports = router;