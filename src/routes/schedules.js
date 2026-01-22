const express = require("express");
const router = express.Router();
const StaffSchedule = require("../models/StaffSchedule");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET all schedules for logged-in staff
router.get("/schedules", async (req, res) => {
  try {
    const schedules = await StaffSchedule.findAllForStaff(req.session.user.id);
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE new schedule
router.post("/schedules", async (req, res) => {
  try {
    const id = await StaffSchedule.create({
      ...req.body,
      staff_id: req.session.user.id,
    });

    const newSchedule = await StaffSchedule.findById(id);
    res.json(newSchedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE existing schedule
router.put("/schedules/:id", async (req, res) => {
  try {
    await StaffSchedule.update(req.params.id, req.session.user.id, req.body);

    const updated = await StaffSchedule.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH only status
router.patch("/schedules/:id", async (req, res) => {
  try {
    await StaffSchedule.updateStatus(
      req.params.id,
      req.session.user.id,
      req.body.status
    );

    const updated = await StaffSchedule.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (soft delete)
router.delete("/schedules/:id", async (req, res) => {
  try {
    await StaffSchedule.softDelete(req.params.id, req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
