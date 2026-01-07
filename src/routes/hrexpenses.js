const express = require("express");
const router = express.Router();
const HrExpense = require("../models/HrExpenses");

// Get all expenses
router.get("/expenses", async (req, res) => {
  try {
    const expenses = await HrExpense.findAll();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new expense
router.post("/expenses", async (req, res) => {
  try {
    const newExpense = await HrExpense.create(req.body);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put("/expenses/:id", async (req, res) => {
  try {
    const updated = await HrExpense.update(req.params.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete("/expenses/:id", async (req, res) => {
  try {
    await HrExpense.delete(req.params.id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;