const express = require('express');
const router = express.Router();
const Sale = require('../models/Sales');

// Get all sales
router.get('/sales', async (req, res) => {
    try {
        const sales = await Sale.findAll();
        res.json(sales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create sale
router.post('/sale', async (req, res) => {
    try {
        await Sale.create(req.body);
        res.status(201).json({ message: "Sale recorded" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update sale
router.put('/sale/:id', async (req, res) => {
    try {
        await Sale.update(req.params.id, req.body);
        res.json({ message: "Sale updated" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete sale
router.delete('/sale/:id', async (req, res) => {
    try {
        await Sale.delete(req.params.id);
        res.json({ message: "Sale deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;