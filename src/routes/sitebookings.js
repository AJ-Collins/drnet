const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

/**
 * @route POST /api/bookings
 * @desc Create a new booking 
 */
router.post('/bookings', async (req, res) => {
    try {
        const id = await Booking.create(req.body);
        res.status(201).json({ success: true, message: "Booking created", id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create booking" });
    }
});

module.exports = router;