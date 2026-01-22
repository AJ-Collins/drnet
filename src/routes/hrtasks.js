const express = require("express");
const router = express.Router();
const HrTask = require("../models/HrTasks");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

router.get("/tasks", async (req, res) => {
  try {
    const tasks = await HrTask.findAll();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/tasks", async (req, res) => {
  try {
    const newTask = await HrTask.create(req.body);
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/tasks/:id", async (req, res) => {
  try {
    const updated = await HrTask.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/tasks/:id", async (req, res) => {
  try {
    await HrTask.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;