const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// Get All Staff
router.get('/', async (req, res) => {
    try {
        const staff = await Staff.findAll();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Staff
router.post('/', async (req, res) => {
    try {
        const result = await Staff.create(req.body);
        res.status(201).json({ message: "Staff created", id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Staff
router.put('/:id', async (req, res) => {
    try {
        await Staff.update(req.params.id, req.body);
        res.json({ message: "Staff updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Staff
router.delete('/:id', async (req, res) => {
    try {
        await Staff.delete(req.params.id);
        res.json({ message: "Staff deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GEt roles
router.get('/roles', async (req, res) => {
    try {
        const roles = await Staff.getRoles();
        res.json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;