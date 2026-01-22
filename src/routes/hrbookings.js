const express = require("express");
const router = express.Router();
const HrBooking = require("../models/HrBooking");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

router.get("/bookings", async (req, res) => {
  try {
    const results = await HrBooking.findAll();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bookings", async (req, res) => {
  try {
    const booking = await HrBooking.create(req.body);
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/bookings/:id", async (req, res) => {
  try {
    const updated = await HrBooking.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/bookings/:id", async (req, res) => {
  try {
    await HrBooking.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;