const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

// ✅ Create new booking
router.post("/bookings", async (req, res) => {
  try {
    const booking = req.body;

    // Optional: Validate required fields
    if (
      !booking.name ||
      !booking.phone ||
      !booking.email ||
      !booking.location
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await Booking.create(booking);
    res.status(201).json({
      message: "Booking created successfully",
      booking_id: result.insertId,
    });
  } catch (err) {
    console.error("Error creating booking:", err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// ✅ Get all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// ✅ Get single booking
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Error fetching booking:", err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// ✅ Update booking
router.put("/bookings/:id", async (req, res) => {
  try {
    const result = await Booking.update(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found" });

    res.json({ message: "Booking updated successfully" });
  } catch (err) {
    console.error("Error updating booking:", err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// ✅ Delete booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    const result = await Booking.delete(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found" });

    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

module.exports = router;
