const express = require('express');
const router = express.Router();
const HrProject = require('../models/HrProjects');

// GET /api/projects
router.get('/projects', async (req, res) => {
    try {
        const data = await HrProject.getAllProjects();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/projects
router.post('/projects', async (req, res) => {
    try {
        const id = await HrProject.createProject(req.body);
        res.status(201).json({ id, message: "Project Created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/requests
router.get('/requests', async (req, res) => {
    try {
        const data = await HrProject.getAllRequests();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/requests
router.post('/requests', async (req, res) => {
    try {
        await HrProject.createRequest(req.body);
        res.status(201).json({ message: "Request Submitted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/requests/:id/approve
router.patch('/requests/:id/approve', async (req, res) => {
    try {
        await HrProject.approveRequest(req.params.id);
        res.json({ message: "Approved and Synchronized" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/resources
router.get('/resources', async (req, res) => {
    try {
        const data = await HrProject.getResources();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { progress, logistics } = req.body;

    try {
        // Validation
        if (progress === undefined || !logistics) {
            return res.status(400).json({ error: "Missing progress or logistics data" });
        }

        const success = await HrProject.updateProject(id, { progress, logistics });

        if (success) {
            res.json({ success: true, message: "Project updated successfully" });
        } else {
            res.status(404).json({ error: "Project not found" });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: "Server error", details: error.message });
    }
});

module.exports = router;