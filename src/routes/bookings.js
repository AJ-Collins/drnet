const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

/**
 * @route GET /api/bookings
 * @desc Get all bookings for the Admin Dashboard
 */
router.get('/bookings', async (req, res) => {
    try {
        const bookings = await Booking.findAll();
        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});

/**
 * @route PATCH /api/bookings/:id/status
 * @desc Update booking status (Pending -> Confirmed -> Installed)
 */
router.patch('/bookings/:id/status', async (req, res) => {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'installed', 'cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
    }

    try {
        await Booking.updateStatus(req.params.id, status);
        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update status" });
    }
});

/**
 * @route DELETE /api/bookings/:id
 * @desc Delete a booking record
 */
router.delete('/bookings/:id', async (req, res) => {
    try {
        await Booking.delete(req.params.id);
        res.json({ success: true, message: "Booking deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete booking" });
    }
});

module.exports = router;