const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get All Clients
router.get('/', async (req, res) => {
    try {
        const clients = await Client.findAll();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Client
router.post('/', async (req, res) => {
    try {
        const result = await Client.create(req.body);
        delete req.body.password;
        res.status(201).json({ message: "Client created", id: result.insertId });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Client
router.put('/:id', async (req, res) => {
    try {
        await Client.update(req.params.id, req.body);
        res.json({ message: "Client updated successfully" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete Client
router.delete('/:id', async (req, res) => {
    try {
        await Client.delete(req.params.id);
        res.json({ message: "Client deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;