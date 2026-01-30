const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignments");
const Staff = require("../models/Staff");
const smsService = require("../services/smsService");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

/**
 * GET /api/manage/staff
 * Get all staff members with their assignment counts
 */
router.get("/manage/staff", async (req, res) => {
    try {
        const staff = await Assignment.getAllStaffWithAssignments();
        res.json(staff);
    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ error: "Failed to fetch staff members" });
    }
});

/**
 * GET /api/staff/:staffId/assignments
 * Get all assignments for a specific staff member
 */
router.get("/staff/:staffId/assignments", async (req, res) => {
    try {
        const { staffId } = req.params;
        
        // Verify staff exists
        const staff = await Assignment.getStaffById(staffId);
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        const assignments = await Assignment.getStaffAssignments(staffId);
        res.json(assignments);
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});

/**
 * GET /api/staff/:staffId/stats
 * Get assignment statistics for a staff member
 */
router.get("/staff/:staffId/stats", async (req, res) => {
    try {
        const { staffId } = req.params;
        
        // Verify staff exists
        const staff = await Assignment.getStaffById(staffId);
        if (!staff) {
            return res.status(404).json({ error: "Staff member not found" });
        }

        const stats = await Assignment.getStaffStats(staffId);
        res.json(stats);
    } catch (error) {
        console.error("Error fetching stats:", error);
        res.status(500).json({ error: "Failed to fetch statistics" });
    }
});

/**
 * POST /api/assignments
 * Create a new assignment
 */
router.post("/assignments", async (req, res) => {
    try {
        const { staff_id, subject, instructions, send_notification } = req.body;

        // Validate assignment data
        const validationError = await Assignment.validateAssignmentData({
            staff_id,
            subject,
            assignment_note: instructions
        });

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Get staff details
        const staff = await Staff.findById(staff_id);

        if (!staff) {
            throw new Error("Staff not found");
        }

        // Create assignment
        const assignmentData = {
            staff_id,
            subject,
            assignment_note: instructions || null
        };

        const newAssignment = await Assignment.createAssignment(assignmentData);

        // Send SMS notification if requested
        if (send_notification && staff.phone) {
            try {
                const smsMessage = `Hello ${staff.first_name}, you have been assigned a new task: "${subject}". "${instructions}". Task ID: ${newAssignment.assignment_ticket_id}`;
                
                await smsService.sendSMS(staff.phone, smsMessage);
                console.log(`SMS notification sent to ${staff.phone} for assignment ${newAssignment.assignment_ticket_id}`);
            } catch (smsError) {
                console.error("Failed to send SMS notification:", smsError);
            }
        }

        res.status(201).json({
            success: true,
            message: "Assignment created successfully",
            assignment: newAssignment
        });
    } catch (error) {
        console.error("Error creating assignment:", error);
        res.status(500).json({ error: "Failed to create assignment" });
    }
});

/**
 * GET /api/assignments/:assignmentId
 * Get a single assignment by ID
 */
router.get("/assignments/:assignmentId", async (req, res) => {
    try {
        const { assignmentId } = req.params;
        
        const assignment = await Assignment.getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        res.json(assignment);
    } catch (error) {
        console.error("Error fetching assignment:", error);
        res.status(500).json({ error: "Failed to fetch assignment" });
    }
});

/**
 * PUT /api/assignments/:assignmentId
 * Update an assignment
 */
router.put("/assignments/:assignmentId", async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { staff_id, subject, instructions, send_notification } = req.body;

        // Check if assignment exists
        const exists = await Assignment.assignmentExists(assignmentId);
        if (!exists) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        // Validate assignment data
        const validationError = await Assignment.validateAssignmentData({
            staff_id,
            subject,
            assignment_note: instructions
        });

        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Get staff details
        const staff = await Staff.findById(staff_id);

        // Update assignment
        const assignmentData = {
            staff_id,
            subject,
            assignment_note: instructions || null
        };

        const updated = await Assignment.updateAssignment(assignmentId, assignmentData);

        if (!updated) {
            return res.status(500).json({ error: "Failed to update assignment" });
        }

        // Send SMS notification if requested
        if (send_notification && staff.phone) {
            try {
                const assignment = await Assignment.getAssignmentById(assignmentId);
                const smsMessage = `Hello ${staff.first_name}, your task has been updated: "${subject}". "${instructions}". Please check your dashboard for details. Task ID: ${assignment.assignment_ticket_id}`;
                
                await smsService.sendSMS(staff.phone, smsMessage);
                console.log(`SMS update notification sent to ${staff.phone} for assignment ${assignmentId}`);
            } catch (smsError) {
                console.error("Failed to send SMS notification:", smsError);
            }
        }

        res.json({
            success: true,
            message: "Assignment updated successfully"
        });
    } catch (error) {
        console.error("Error updating assignment:", error);
        res.status(500).json({ error: "Failed to update assignment" });
    }
});

/**
 * PATCH /api/assignments/:assignmentId/complete
 * Mark an assignment as completed
 */
router.patch("/assignments/:assignmentId/complete", async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Check if assignment exists
        const assignment = await Assignment.getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        // Mark as completed
        const updated = await Assignment.markAsCompleted(assignmentId);

        if (!updated) {
            return res.status(500).json({ error: "Failed to mark assignment as completed" });
        }

        res.json({
            success: true,
            message: "Assignment marked as completed"
        });
    } catch (error) {
        console.error("Error completing assignment:", error);
        res.status(500).json({ error: "Failed to complete assignment" });
    }
});

/**
 * PATCH /api/assignments/:assignmentId/seen
 * Mark an assignment as seen
 */
router.patch("/assignments/:assignmentId/seen", async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Check if assignment exists
        const exists = await Assignment.assignmentExists(assignmentId);
        if (!exists) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        // Mark as seen
        await Assignment.markAsSeen(assignmentId);

        res.json({
            success: true,
            message: "Assignment marked as seen"
        });
    } catch (error) {
        console.error("Error marking assignment as seen:", error);
        res.status(500).json({ error: "Failed to mark assignment as seen" });
    }
});

/**
 * DELETE /api/assignments/:assignmentId
 * Delete an assignment
 */
router.delete("/assignments/:assignmentId", async (req, res) => {
    try {
        const { assignmentId } = req.params;

        // Check if assignment exists
        const exists = await Assignment.assignmentExists(assignmentId);
        if (!exists) {
            return res.status(404).json({ error: "Assignment not found" });
        }

        // Delete assignment
        const deleted = await Assignment.deleteAssignment(assignmentId);

        if (!deleted) {
            return res.status(500).json({ error: "Failed to delete assignment" });
        }

        res.json({
            success: true,
            message: "Assignment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting assignment:", error);
        res.status(500).json({ error: "Failed to delete assignment" });
    }
});

module.exports = router;