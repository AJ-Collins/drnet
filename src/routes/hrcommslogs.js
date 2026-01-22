const express = require("express");
const router = express.Router();
const HrCommunication = require("../models/HrCommsLogs");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

router.get("/logs", async (req, res) => {
  try {
    const logs = await HrCommunication.findRecent();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/logs", async (req, res) => {
  try {
    const log = await HrCommunication.create(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/logs/:id", async (req, res) => {
  try {
    await HrCommunication.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;