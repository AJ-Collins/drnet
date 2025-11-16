const express = require("express");
const db = require("../config/db");
const path = require("path");
const router = express.Router();
const StaffAttendance = require("../models/StaffAttendance");

// Admin Attendance Routes
//Get all attendance records
router.get("/attendance", async (req, res) => {
  try {
    const records = await StaffAttendance.findAll();
    res.json(records);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// Get attendance for a specific staff on a date
router.get("/attendance/:staffId/:date", async (req, res) => {
  try {
    const { staffId, date } = req.params;
    const record = await StaffAttendance.findByStaffAndDate(staffId, date);
    if (!record) return res.status(404).json({ error: "Attendance not found" });
    res.json(record);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// 🔹 Create attendance
router.post("/attendance", async (req, res) => {
  try {
    const kenya_offset = 3 * 60 * 60 * 1000;
    const todayInKenya = new Date(Date.now() + kenya_offset);
    const attendanceDate =
      req.body.attendance_date || todayInKenya.toISOString().split("T")[0];

    const mapped = {
      staff_id: req.body.staff_id,
      time_in: req.body.time_in || null,
      time_out: req.body.time_out || null,
      status: req.body.status,
      attendance_date: attendanceDate,
      marked_by: req.session.user.id,
    };

    const result = await StaffAttendance.create(mapped);

    if (!result.success) {
      return res.status(400).json(result); // prevent duplicate
    }

    return res.json(result);
  } catch (err) {
    console.error("Error creating attendance:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create attendance",
      details: err.message,
    });
  }
});

// 🔹 Update attendance
router.put("/attendance/:id", async (req, res) => {
  try {
    const result = await StaffAttendance.update(req.params.id, req.body);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({ error: "Failed to update attendance" });
  }
});

// 🔹 Delete attendance
router.delete("/attendance/:id", async (req, res) => {
  try {
    const result = await StaffAttendance.delete(req.params.id);
    res.json({ success: true, affectedRows: result.affectedRows });
  } catch (err) {
    console.error("Error deleting attendance:", err);
    res.status(500).json({ error: "Failed to delete attendance" });
  }
});

module.exports = router;
