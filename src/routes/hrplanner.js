const express = require("express");
const router = express.Router();
const HrPlanner = require("../models/HrPlanner");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

router.get("/planner", async (req, res) => {
    try {
        const data = await HrPlanner.findAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/planner/status", async (req, res) => {
    const { id, status, source } = req.body;
    try {
        const updated = await HrPlanner.updateStatus(id, status, source);
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;