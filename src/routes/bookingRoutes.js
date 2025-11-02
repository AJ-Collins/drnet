const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, deleteBooking, updateBooking, updateBookingStatus } = require('../models/Booking');

router.get('/test', (req, res) => res.send('✅ Booking route working'));

// ✅ Create Booking
router.post('/', async (req, res) => {
  try {
    const requiredFields = [
      'name',
      'phone',
      'email',
      'location',
      'exact_location',
      'package',
      'extra_notes',
      'installation_date',
      'status'
    ];

    // Assign null to any missing fields
    requiredFields.forEach(field => {
      if (req.body[field] === undefined || req.body[field] === '') {
        req.body[field] = null;
      }
    });

    // Optional: if installation_date exists and is not null, format it
    if (req.body.installation_date) {
      const dateOnly = new Date(req.body.installation_date).toISOString().split('T')[0];
      req.body.installation_date = dateOnly;
    }

    await createBooking(req.body);

    res.status(201).json({ message: '✅ Booking saved' });
  } catch (err) {
    console.error("❌ Error saving booking:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ Get All Bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await getAllBookings();
    res.json(bookings);
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteBooking(id);
    res.json({ message: '✅ Booking deleted' });
  } catch (err) {
    console.error('❌ Error deleting booking:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      phone,
      location,
      exact_location,
      package: pkg,
      status,
      installation_date,
      extra_notes
    } = req.body;

    // Check for missing fields
    const missingFields = [];

    if (!name?.trim()) missingFields.push('name');
    if (!email?.trim()) missingFields.push('email');
    if (!phone?.trim()) missingFields.push('phone');
    if (!location?.trim()) missingFields.push('location');
    if (!exact_location?.trim()) missingFields.push('exact_location');
    if (!pkg?.trim()) missingFields.push('package');
    if (!status?.trim()) missingFields.push('status');
    if (!installation_date?.trim()) missingFields.push('installation_date');
    if (!extra_notes?.trim()) missingFields.push('extra_notes');

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `❌ Missing required fields: ${missingFields.join(', ')}`
      });
    }

    await updateBooking(id, {
      name,
      email,
      phone,
      location,
      exact_location,
      package: pkg,
      status,
      installation_date,
      extra_notes
    });

    res.json({ message: '✅ Booking updated' });

  } catch (err) {
    console.error('❌ Error updating booking:', err);
    res.status(500).json({ message: 'Server error during update' });
  }
});


router.put('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Missing status value' });
    }

    await updateBookingStatus(id, status);
    res.status(200).json({ message: '✅ Booking status updated' });
  } catch (err) {
    console.error('❌ Error updating booking status:', err);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

module.exports = router;
