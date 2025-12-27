const express = require('express');
const router = express.Router();
const Task = require('../models/HrTasks');

// GET /api/tasks
router.get('/tasks', async (req, res) => {
    try {
        const data = await Task.getAll();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/tasks
router.post('/tasks', async (req, res) => {
    try {
        const newTask = await Task.create(req.body);
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH /api/tasks/:id
router.patch('/tasks/:id', async (req, res) => {
    try {
        const updated = await Task.update(req.params.id, req.body);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', async (req, res) => {
    try {
        await Task.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/tasks/:id/comments
router.post('/tasks/:id/comments', async (req, res) => {
    try {
        const updatedTask = await Task.addComment(req.params.id, req.body.text);
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;