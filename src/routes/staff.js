const express = require("express");
const router = express.Router();
const StaffClientAssignment = require("../models/StaffClientAssignment");
const db = require("../config/db");
const dayjs = require("dayjs");

// GET: My Assignments
router.get("/my/assignments", async (req, res) => {
  try {
    // Debug: Check if user session exists
    console.log("Session user:", req.session.user);
    
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const userId = req.session.user.id;
    console.log("Fetching assignments for user ID:", userId);
    
    const assignments = await StaffClientAssignment.findMyAssignments(userId);
    console.log("Found assignments:", assignments.length);
    
    res.json(assignments);
  } catch (err) {
    console.error("Error fetching assignments:", err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// PATCH: Mark as complete
router.patch("/assignments/:id/complete", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const assignment = await StaffClientAssignment.findById(req.params.id);

    if (!assignment || assignment.technicianId !== userId) {
      return res.status(404).json({ error: "Not found or unauthorized" });
    }

    await StaffClientAssignment.update(req.params.id, {
      status: "completed",
      completedAt: new Date(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update" });
  }
});

// EXPORT CSV
router.get("/assignments/export", async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT 
        clientName, clientContact, serviceType, priority, scheduledDate,
        estimatedDuration, status, address, description, requiredEquipment
      FROM assignments
      WHERE technicianId = ? OR supervisorId = ?
      ORDER BY scheduledDate
    `,
      [req.user.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(200).send("No assignment data to export.");
    }

    const headers = Object.keys(rows[0]).join(",");
    const csv = [
      headers,
      ...rows.map((r) =>
        Object.values(r)
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      ),
    ].join("\n");

    res.header("Content-Type", "text/csv");
    res.attachment(`assignments_${dayjs().format("YYYY-MM-DD")}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Export failed");
  }
});

module.exports = router;