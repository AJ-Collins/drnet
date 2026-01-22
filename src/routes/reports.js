const express = require("express");
const router = express.Router();
const Report = require("../models/Reports");
const notificationService = require("../services/notificationService");
const Staff = require("../models/Staff");
const Role = require("../models/Role");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET all reports
router.get("/reports", async (req, res) => {
  try {
    const reports = await Report.findAll();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reports", error: err.message });
  }
});

// GET single report
router.get("/report:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create new report
router.post("/report", async (req, res) => {
  try {
    const { report_type, start_date, end_date, content } = req.body;
    const staffId = req.session.user.id;

    if (!report_type || !start_date || !end_date || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const staff = await Staff.findOne(staffId);

    if (!staff) {
      return res.status(404).json({ message: 'Staff details not found' });
    }

    const role = await Role.findOne(staff.role_id);

    if (!role) {
      return res.status(404).json({ message: 'This staff does not have a role.'});
    }

    const newReport = await Report.create({
      report_type,
      start_date,
      end_date,
      content,
      generated_by: role.name || "Supervisor",
    });

    const snippet = content.length > 50 ? content.substring(0, 50) + "..." : content;

    await notificationService.createForRole({
      type: 'report',
      reference_id: newReport.id, 
      title: `New ${report_type} report`,
      message: snippet,
      role_id: [1] 
    });

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report: newReport
    });
  } catch (err) {
    console.error("Create report error:", err);
    res.status(500).json({ message: "Failed to create report", error: err.message });
  }
});

// PATCH update status (e.g., approve/reject)
router.patch("/report/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const updated = await Report.updateStatus(req.params.id, status);

    const snippet = updated.content.length > 50 
      ? updated.content.substring(0, 50) + "..." 
      : updated.content;

    await notificationService.createForRole({
      type: 'report_status',
      reference_id: updated.id, 
      title: `Report status: ${status}`,
      message: snippet,
      role_id: [1, 2] 
    });

    res.json({ success: true, report: updated });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/reports/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const deleted = await Report.delete(id);
        res.json({ success: true, report:deleted });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;