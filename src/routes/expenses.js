const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/expenses
router.get("/expenses", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, category, amount, expense_date AS date,
             vendor AS payee, '' AS payment_method, description, '' AS reference
      FROM expenses
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/expenses", async (req, res) => {
  const {
    category,
    amount,
    date,
    payee,
    payment_method,
    description,
    reference,
  } = req.body;
  try {
    const [ins] = await db.query(
      `INSERT INTO expenses
       (category, amount, expense_date, vendor, description)
       VALUES (?, ?, ?, ?, ?)`,
      [category, amount, date, payee, description]
    );
    res.json({ id: ins.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/expenses/:id", async (req, res) => {
  const { id } = req.params;
  const {
    category,
    amount,
    date,
    payee,
    description,
    payment_method,
    reference,
  } = req.body;

  try {
    const [upd] = await db.query(
      `UPDATE expenses
       SET category = ?, amount = ?, expense_date = ?, vendor = ?, description = ?
       WHERE id = ?`,
      [category, amount, date, payee, description, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/expenses/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM expenses WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
