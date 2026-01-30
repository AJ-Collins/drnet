const express = require("express");
const router = express.Router();
const StaffClientAssignment = require("../models/StaffAssignments");
const db = require("../config/db");
const dayjs = require("dayjs");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET: My Assignments
// router.get("/my/assignments", async (req, res) => {
//   try {
//     console.log("Session user:", req.session.user);

//     if (!req.session.user || !req.session.user.id) {
//       return res.status(401).json({ error: "Not authenticated" });
//     }

//     const userId = req.session.user.id;
//     console.log("Fetching assignments for user ID:", userId);

//     const assignments = await StaffClientAssignment.findMyAssignments(userId);
//     console.log("Found assignments:", assignments.length);

//     res.json(assignments);
//   } catch (err) {
//     console.error("Error fetching assignments:", err);
//     res.status(500).json({ error: "Failed to fetch assignments" });
//   }
// });



// // PATCH: Mark as complete
// // router.patch("/assignments/:id/complete", async (req, res) => {
// //   try {
// //     const userId = req.session.user.id;

// //     const assignment = await StaffClientAssignment.findById(req.params.id);

// //     if (!assignment || assignment.technicianId !== userId) {
// //       return res.status(404).json({ error: "Not found or unauthorized" });
// //     }

// //     await StaffClientAssignment.update(req.params.id, {
// //       status: "completed",
// //       completedAt: new Date(),
// //     });

// //     res.json({ success: true });
// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Failed to update" });
// //   }
// // });

// // EXPORT CSV
// router.get("/assignments/export", async (req, res) => {
//   try {
//     const [rows] = await db.query(
//       `
//       SELECT 
//         clientName, clientContact, serviceType, priority, scheduledDate,
//         estimatedDuration, status, address, description, requiredEquipment
//       FROM assignments
//       WHERE technicianId = ? OR supervisorId = ?
//       ORDER BY scheduledDate
//     `,
//       [req.user.id, req.user.id]
//     );

//     if (rows.length === 0) {
//       return res.status(200).send("No assignment data to export.");
//     }

//     const headers = Object.keys(rows[0]).join(",");
//     const csv = [
//       headers,
//       ...rows.map((r) =>
//         Object.values(r)
//           .map((v) => `"${v ?? ""}"`)
//           .join(",")
//       ),
//     ].join("\n");

//     res.header("Content-Type", "text/csv");
//     res.attachment(`assignments_${dayjs().format("YYYY-MM-DD")}.csv`);
//     res.send(csv);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Export failed");
//   }
// });

// router.get("/dashboard/data", async (req, res) => {
//   try {
//     const userId = req.session.user?.id;
//     if (!userId) return res.status(401).json({ error: "Unauthorized" });

//     // Today's Tasks (Assignments)
//     const [tasks] = await db.query(
//       `SELECT 
//         a.id,
//         a.clientName AS client,
//         a.address,
//         a.serviceType AS title,
//         DATE_FORMAT(a.scheduledDate, '%H:%i') AS time,
//         a.priority,
//         a.status
//       FROM assignments a
//       WHERE a.technicianId = ? 
//         AND DATE(a.scheduledDate) = CURDATE()
//       ORDER BY a.scheduledDate ASC`,
//       [userId]
//     );

//     // Recent Payslips (last 3)
//     const [payslips] = await db.query(
//       `SELECT 
//         id,
//         DATE_FORMAT(pay_period, '%M %Y') AS month,
//         pay_period AS date,
//         net_pay
//       FROM staff_payslips 
//       WHERE staff_id = ?
//       ORDER BY pay_period DESC 
//       LIMIT 3`,
//       [userId]
//     );

//     // Stats
//     const open = tasks.filter(
//       (t) => !["completed", "cancelled"].includes(t.status)
//     ).length;
//     const completed = tasks.filter((t) => t.status === "completed").length;
//     const total = tasks.length;
//     const performanceScore =
//       total > 0 ? Math.round((completed / total) * 100) : 0;

//     // Weekly Performance (simple mock — replace with real logic later)
//     const weeklyData = {
//       labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
//       values: Array(7)
//         .fill()
//         .map(() => Math.floor(Math.random() * 35) + 65),
//     };

//     res.json({
//       tasks: tasks.map((t) => ({
//         id: t.id,
//         title: t.title,
//         client: t.client,
//         address: t.address || "Not specified",
//         time: t.time || "All Day",
//         status:
//           t.status === "completed"
//             ? "Completed"
//             : t.status === "in-progress"
//             ? "In Progress"
//             : "Pending",
//         statusColor:
//           t.priority === "high"
//             ? "red"
//             : t.priority === "medium"
//             ? "yellow"
//             : "green",
//       })),
//       payslips: payslips.map((p) => ({
//         id: p.id,
//         month: p.month,
//         date: p.date,
//       })),
//       stats: {
//         openTickets: open,
//         activeTasks: total,
//         completedTasks: completed,
//         performanceScore,
//       },
//       chart: weeklyData,
//     });
//   } catch (err) {
//     console.error("Dashboard data error:", err);
//     res.status(500).json({ error: "Failed to load dashboard" });
//   }
// });

// router.get("/my/dashboard/assignments", async (req, res) => {
//   try {
//     const userId = req.session.user?.id;
//     if (!userId) return res.status(401).json({ error: "Unauthorized" });

//     const [rows] = await db.query(
//       `SELECT 
//         a.id,
//         a.clientName AS client,
//         a.address,
//         a.serviceType AS title,
//         DATE_FORMAT(a.scheduledDate, '%H:%i') AS time,
//         a.status
//       FROM assignments a
//       WHERE a.technicianId = ?
//       ORDER BY a.scheduledDate ASC`,
//       [userId]
//     );

//     const tasks = rows.map((t) => ({
//       id: t.id,
//       title: t.title,
//       client: t.client,
//       address: t.address || "Not specified",
//       time: t.time || "All Day",

//       // --- Status conversions ---
//       status: t.status === "completed" ? "Completed" : "Assigned",

//       // --- Status color mapping ---
//       // Green → Completed
//       // Yellow → Assigned
//       statusColor: t.status === "completed" ? "green" : "yellow",
//     }));

//     res.json(tasks);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Failed to load tasks" });
//   }
// });

// router.get("/staff/dashboard/stats", async (req, res) => {
//   try {
//     const userId = req.session.user?.id;
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     // Open Tickets: Support tickets assigned to this staff member (from support_tickets table)
//     const [openTicketsResult] = await db.query(
//       `SELECT COUNT(*) as count FROM support_tickets 
//        WHERE assigned_to = ? 
//          AND status = 'open'`,
//       [userId]
//     );

//     // Active Tasks: Assignments with status 'assigned' (from assignments table)
//     const [activeTasksResult] = await db.query(
//       `SELECT COUNT(*) as count FROM assignments 
//        WHERE technicianId = ? 
//          AND status = 'assigned'`,
//       [userId]
//     );

//     // Completed Tasks: Assignments completed this month
//     const [completedTasksResult] = await db.query(
//       `SELECT COUNT(*) as count FROM assignments 
//        WHERE technicianId = ? 
//          AND status = 'completed'
//          AND MONTH(completedAt) = MONTH(CURDATE())`,
//       [userId]
//     );

//     // Total assigned tasks this month (for performance calculation)
//     const [totalAssignedResult] = await db.query(
//       `SELECT COUNT(*) as count FROM assignments 
//        WHERE technicianId = ? 
//          AND MONTH(completedAt) = MONTH(CURDATE())`,
//       [userId]
//     );

//     const openTickets = openTicketsResult[0].count;
//     const activeTasks = activeTasksResult[0].count;
//     const completedTasks = completedTasksResult[0].count;
//     const totalAssignedThisMonth = totalAssignedResult[0].count;

//     // Calculate performance score: (completed this month / total assigned this month) * 100
//     const performanceScore =
//       totalAssignedThisMonth > 0
//         ? Math.round((completedTasks / totalAssignedThisMonth) * 100)
//         : 0;

//     // Log for debugging
//     console.log("Staff Stats:", {
//       userId,
//       openTickets,
//       activeTasks,
//       completedTasks,
//       totalAssignedThisMonth,
//       performanceScore,
//     });

//     res.json({
//       openTickets, // Support tickets assigned to staff with status 'open'
//       activeTasks, // Assignments with status 'assigned'
//       completedTasks, // This month's completed assignments
//       performanceScore, // (Completed / Total) * 100 for this month
//     });
//   } catch (err) {
//     console.error("Error fetching dashboard stats:", err);
//     res.status(500).json({ error: "Failed to load stats" });
//   }
// });

router.get("/payslips/recent", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const [rows] = await db.query(
      `SELECT 
        id,
        DATE_FORMAT(payment_date, '%M %Y') AS month,
        pay_period AS date,
        net_pay
      FROM staff_payslips 
      WHERE staff_id = ?
      ORDER BY pay_period DESC 
      LIMIT 3`,
      [userId]
    );

    res.json(
      rows.map((p) => ({
        id: p.id,
        month: p.month,
        date: p.date,
        net_pay: p.net_pay,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payslips" });
  }
});

router.get("/staff/payslips/:id", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    const payslipId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const [rows] = await db.query(
      `SELECT 
        sp.id,
        sp.pay_period,
        sp.gross_pay,
        sp.net_pay,
        sp.allowances,
        sp.allowance_description,
        sp.deductions,
        sp.deduction_description,
        sp.payment_method,
        sp.payment_date,
        sp.created_at,

        s.first_name,
        s.second_name,
        s.email,
        s.phone,
        s.employee_id,
        s.position,
        s.department,

        ss.basic_salary,
        ss.bonuses,
        ss.deductions AS salary_deductions_amount
      FROM staff_payslips sp
      JOIN staff s ON sp.staff_id = s.id
      JOIN staff_salaries ss ON sp.salary_id = ss.id
      WHERE sp.id = ? AND sp.staff_id = ?
      LIMIT 1`,
      [payslipId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const p = rows[0];

    // Parse only the JSON fields that actually exist
    const slipAllowances = p.allowances ? JSON.parse(p.allowances) : {};
    const slipDeductions = p.deductions ? JSON.parse(p.deductions) : {};

    // Build salary allowances from what you have
    const salaryAllowances = {
      "Basic Salary": Number(p.basic_salary),
      Bonuses: Number(p.bonuses || 0),
      // Add more if you ever extend the table
    };

    const response = {
      id: p.id,
      payPeriod: p.pay_period,
      paymentDate: p.payment_date,

      staff: {
        name: `${p.first_name} ${p.second_name}`.trim(),
        email: p.email,
        phone: p.phone,
        employeeId: p.employee_id || `EMP${userId}`,
        position: p.position || "Staff",
        department: p.department || "General",
      },

      earnings: {
        basicSalary: Number(p.basic_salary),
        salaryAllowances, // Bonuses, etc.
        slipAllowances, // One-time allowances from payslip
        allowanceDescription: p.allowance_description || "",
      },

      deductions: {
        salaryDeductions: {
          "Standard Deductions": Number(p.salary_deductions_amount || 0),
        },
        slipDeductions, // One-time deductions
        deductionDescription: p.deduction_description || "",
      },

      summary: {
        grossPay: Number(p.gross_pay),
        totalDeductions: Number(p.gross_pay) - Number(p.net_pay),
        netPay: Number(p.net_pay),
      },

      paymentMethod: p.payment_method || "bank",
    };

    return res.json(response);
  } catch (err) {
    console.error("Error fetching payslip:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/performance/weekly", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get the last 7 days of data with dates
    const [weeklyAssignments] = await db.query(
      `SELECT 
          DATE(completedAt) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM assignments
      WHERE technicianId = ?
        AND DATE(completedAt) BETWEEN DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND CURDATE()
      GROUP BY DATE(completedAt)
      ORDER BY DATE(completedAt) ASC`,
      [userId]
    );

    // Create a map of dates to performance scores
    const dateMap = new Map();
    weeklyAssignments.forEach((row) => {
      const performanceScore =
        row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;

      // Convert date to string format (YYYY-MM-DD)
      let dateStr;
      if (row.date instanceof Date) {
        dateStr = row.date.toISOString().split("T")[0];
      } else {
        // If it's already a string, use it directly or format it
        dateStr = row.date;
      }

      dateMap.set(dateStr, performanceScore);
    });

    // Generate last 7 days
    const labels = [];
    const values = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dateStr = date.toISOString().split("T")[0];
      const dayName = dayNames[date.getDay()];

      labels.push(dayName);
      values.push(dateMap.get(dateStr) || 0);
    }

    console.log("Weekly Performance Data:", {
      userId,
      labels,
      values,
      dateMap: Array.from(dateMap.entries()),
      rawData: weeklyAssignments,
    });

    res.json({
      labels: labels,
      values: values,
    });
  } catch (err) {
    console.error("Error fetching weekly performance:", err);
    res.status(500).json({ error: "Failed to load performance data" });
  }
});

module.exports = router;
