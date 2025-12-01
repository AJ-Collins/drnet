const express = require("express");
const router = express.Router();
const db = require("../config/db");

/**
 * GET /api/payslips (list all payslips)
 */
router.get("/payslips", async (req, res) => {
  try {
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log("Fetching all payslips...");

    const [rows] = await db.query(`
      SELECT 
        sp.id, 
        sp.staff_id, 
        sp.salary_id,
        s.first_name, 
        s.second_name,
        s.email,
        s.phone,
        sp.pay_period AS period, 
        sp.gross_pay,
        sp.net_pay AS net_salary, 
        sp.allowances,
        sp.allowance_description,
        sp.deductions,
        sp.deduction_description,
        sp.payment_method,
        sp.payment_date,
        sp.created_at,
        sp.updated_at,
        FALSE AS sent
      FROM staff_payslips sp
      JOIN staff s ON sp.staff_id = s.id
      ORDER BY sp.created_at DESC
    `);

    console.log(`Found ${rows.length} payslips`);

    if (rows.length === 0) {
      return res.json([]);
    }

    // Parse JSON fields and format response
    const formattedRows = rows.map((row) => {
      let allowances = [];
      let allowance_description = [];
      let deductions = [];
      let deduction_description = [];

      // Safely parse JSON fields
      try {
        allowances = typeof row.allowances === 'string' 
          ? JSON.parse(row.allowances) 
          : (row.allowances || []);
      } catch (e) {
        console.warn(`Failed to parse allowances for payslip ${row.id}`);
        allowances = [];
      }

      try {
        allowance_description = typeof row.allowance_description === 'string' 
          ? JSON.parse(row.allowance_description) 
          : (row.allowance_description || []);
      } catch (e) {
        console.warn(`Failed to parse allowance_description for payslip ${row.id}`);
        allowance_description = [];
      }

      try {
        deductions = typeof row.deductions === 'string' 
          ? JSON.parse(row.deductions) 
          : (row.deductions || []);
      } catch (e) {
        console.warn(`Failed to parse deductions for payslip ${row.id}`);
        deductions = [];
      }

      try {
        deduction_description = typeof row.deduction_description === 'string' 
          ? JSON.parse(row.deduction_description) 
          : (row.deduction_description || []);
      } catch (e) {
        console.warn(`Failed to parse deduction_description for payslip ${row.id}`);
        deduction_description = [];
      }

      return {
        id: row.id,
        staff_id: row.staff_id,
        salary_id: row.salary_id,
        staff_name: `${row.first_name} ${row.second_name || ""}`.trim(),
        first_name: row.first_name,
        second_name: row.second_name,
        email: row.email,
        phone: row.phone,
        period: row.period,
        gross_pay: parseFloat(row.gross_pay),
        net_salary: parseFloat(row.net_salary),
        allowances: allowances,
        allowance_description: allowance_description,
        deductions: deductions,
        deduction_description: deduction_description,
        payment_method: row.payment_method,
        payment_date: row.payment_date,
        created_at: row.created_at,
        updated_at: row.updated_at,
        sent: false
      };
    });

    res.json(formattedRows);
  } catch (err) {
    console.error("Error fetching payslips:", err);
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

/**
 * GET /api/payslips/:id (get single payslip)
 */
router.get("/payslips/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        sp.*,
        s.first_name,
        s.second_name,
        s.email,
        s.phone
       FROM staff_payslips sp
       JOIN staff s ON sp.staff_id = s.id
       WHERE sp.id = ?`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    const payslip = rows[0];

    // Parse JSON fields
    payslip.allowances = JSON.parse(payslip.allowances || "[]");
    payslip.allowance_description = JSON.parse(
      payslip.allowance_description || "[]"
    );
    payslip.deductions = JSON.parse(payslip.deductions || "[]");
    payslip.deduction_description = JSON.parse(
      payslip.deduction_description || "[]"
    );

    // Combine allowances with descriptions
    payslip.allowances_list = payslip.allowances.map((amount, i) => ({
      amount,
      description: payslip.allowance_description[i] || "",
    }));

    // Combine deductions with descriptions
    payslip.deductions_list = payslip.deductions.map((amount, i) => ({
      amount,
      description: payslip.deduction_description[i] || "",
    }));

    res.json(payslip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/payslips/staff/:staffId (get payslips for specific staff)
 */
router.get("/payslips/staff/:staffId", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        sp.*,
        s.first_name,
        s.second_name
       FROM staff_payslips sp
       JOIN staff s ON sp.staff_id = s.id
       WHERE sp.staff_id = ?
       ORDER BY sp.created_at DESC`,
      [req.params.staffId]
    );

    // Parse JSON fields
    const formattedRows = rows.map((row) => ({
      ...row,
      allowances: JSON.parse(row.allowances || "[]"),
      allowance_description: JSON.parse(row.allowance_description || "[]"),
      deductions: JSON.parse(row.deductions || "[]"),
      deduction_description: JSON.parse(row.deduction_description || "[]"),
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/payslips (create payslip)
 */
router.post("/payslips", async (req, res) => {
  const {
    staffId,
    period,
    basic_salary,
    allowances = [],
    deductions = [],
  } = req.body;

  try {
    // Validate required fields
    if (!staffId || !period) {
      return res.status(400).json({
        error: "staffId and period are required",
      });
    }

    // 1️⃣ Get the latest salary for this staff
    const [salaryRows] = await db.query(
      `SELECT id, basic_salary 
       FROM staff_salaries
       WHERE staff_id = ?
       ORDER BY effective_from DESC
       LIMIT 1`,
      [staffId]
    );

    if (!salaryRows.length) {
      return res.status(404).json({
        error: "Salary not defined for this staff",
      });
    }

    const salaryId = salaryRows[0].id;
    const salaryBase = Number(basic_salary || salaryRows[0].basic_salary || 0);

    // 2️⃣ Calculate totals
    const totalAllowances = allowances.reduce(
      (sum, a) => sum + Number(a.amount || 0),
      0
    );
    const totalDeductions = deductions.reduce(
      (sum, d) => sum + Number(d.amount || 0),
      0
    );

    const grossPay = salaryBase + totalAllowances;
    const netPay = grossPay - totalDeductions;

    // 3️⃣ Check if payslip already exists for this period
    const [existing] = await db.query(
      `SELECT id FROM staff_payslips 
       WHERE staff_id = ? AND pay_period = ?`,
      [staffId, period]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: "Payslip already exists for this period",
      });
    }

    // 4️⃣ Insert payslip
    const [ins] = await db.query(
      `INSERT INTO staff_payslips
       (staff_id, salary_id, pay_period, gross_pay, net_pay, allowances, allowance_description, deductions, deduction_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staffId,
        salaryId,
        period,
        grossPay,
        netPay,
        JSON.stringify(allowances.map((a) => a.amount || 0)),
        JSON.stringify(allowances.map((a) => a.description || "")),
        JSON.stringify(deductions.map((d) => d.amount || 0)),
        JSON.stringify(deductions.map((d) => d.description || "")),
      ]
    );

    // 5️⃣ Get staff details
    const [staff] = await db.query(
      "SELECT first_name, second_name, email FROM staff WHERE id = ?",
      [staffId]
    );

    if (!staff.length) {
      return res.status(404).json({ error: "Staff not found" });
    }

    // 6️⃣ Respond
    res.status(201).json({
      id: ins.insertId,
      staff_id: staffId,
      staff_name: `${staff[0].first_name} ${staff[0].second_name || ""}`.trim(),
      period,
      gross_pay: grossPay,
      net_salary: netPay,
      allowances,
      deductions,
      preview: `Payslip for ${
        staff[0].first_name
      } - ${period}\nGross: KES ${grossPay.toFixed(
        2
      )}\nNet: KES ${netPay.toFixed(2)}`,
      sent: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

/**
 * PUT /api/payslips/:id (update payslip)
 */
router.put("/payslips/:id", async (req, res) => {
  const { id } = req.params;
  const { allowances = [], deductions = [] } = req.body;

  try {
    // Get existing payslip
    const [existing] = await db.query(
      "SELECT * FROM staff_payslips WHERE id = ?",
      [id]
    );

    if (!existing.length) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    // Get salary info
    const [salary] = await db.query(
      "SELECT basic_salary FROM staff_salaries WHERE id = ?",
      [existing[0].salary_id]
    );

    const salaryBase = Number(salary[0].basic_salary || 0);

    // Recalculate
    const totalAllowances = allowances.reduce(
      (sum, a) => sum + Number(a.amount || 0),
      0
    );
    const totalDeductions = deductions.reduce(
      (sum, d) => sum + Number(d.amount || 0),
      0
    );

    const grossPay = salaryBase + totalAllowances;
    const netPay = grossPay - totalDeductions;

    // Update
    await db.query(
      `UPDATE staff_payslips 
       SET gross_pay = ?, net_pay = ?, allowances = ?, allowance_description = ?, deductions = ?, deduction_description = ?
       WHERE id = ?`,
      [
        grossPay,
        netPay,
        JSON.stringify(allowances.map((a) => a.amount || 0)),
        JSON.stringify(allowances.map((a) => a.description || "")),
        JSON.stringify(deductions.map((d) => d.amount || 0)),
        JSON.stringify(deductions.map((d) => d.description || "")),
        id,
      ]
    );

    res.json({
      success: true,
      id,
      gross_pay: grossPay,
      net_pay: netPay,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/payslips/send/:id (send payslip via email/SMS)
 */
router.post("/payslips/send/:id", async (req, res) => {
  try {
    const [payslip] = await db.query(
      `SELECT sp.*, s.email, s.phone, s.first_name
       FROM staff_payslips sp
       JOIN staff s ON sp.staff_id = s.id
       WHERE sp.id = ?`,
      [req.params.id]
    );

    if (!payslip.length) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    // TODO: Implement actual email/SMS sending logic here
    // Example: await sendEmail(payslip[0].email, payslipData);

    console.log(
      `Payslip sent to ${payslip[0].first_name} at ${payslip[0].email}`
    );

    res.json({
      success: true,
      message: `Payslip sent to ${payslip[0].email}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/payslips/:id (delete payslip)
 */
router.delete("/payslips/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM staff_payslips WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Payslip not found" });
    }

    res.json({ success: true, message: "Payslip deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/staff/salaries (get active salaries)
 */
router.get("/staff/salaries", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        ss.id,
        ss.staff_id, 
        ss.basic_salary, 
        ss.net_salary, 
        ss.effective_from,
        ss.effective_to,
        s.first_name,
        s.second_name,
        s.position
      FROM staff_salaries ss
      JOIN staff s ON ss.staff_id = s.id
      WHERE ss.effective_to IS NULL OR ss.effective_to >= CURDATE()
      ORDER BY s.first_name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/payslips/stats (get payslip statistics)
 */
router.get("/payslips/stats", async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_payslips,
        SUM(gross_pay) as total_gross,
        SUM(net_pay) as total_net,
        AVG(net_pay) as avg_net_pay,
        pay_period
      FROM staff_payslips
      GROUP BY pay_period
      ORDER BY created_at DESC
      LIMIT 12
    `);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
