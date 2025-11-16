const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const Booking = require("../models/Booking");
const StaffClientAssignment = require("../models/StaffClientAssignment");
const Item = require("../models/Item");
const User = require("../models/User");
const SupportTicket = require("../models/SupportTicket");
const Payment = require("../models/Payment");
const Renewals = require("../models/Renewal");
const StaffSalary = require("../models/StaffSalary");

router.get("/dashboard/stats", async (req, res) => {
  try {
    // USERS
    const allUsers = await User.findAll();
    const activeUsers = allUsers.filter((u) => u.is_active).length;
    const expiredUsers = allUsers.filter((u) => !u.is_active).length;

    // GROWTH placeholders (you can calculate by comparing previous month)
    const activeGrowth = 12;
    const expiredGrowth = 5;

    // BOOKINGS count
    const allBookings = await Booking.findAll();
    const bookings = allBookings.length;

    // SUPPORT INQUIRIES
    const allTickets = await SupportTicket.findAll();
    const inquiries = allTickets.length;

    // REVENUE
    // Sum of all renewals + item sales
    let revenueFromRenewals = 0;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const monthlyRenewals = await Renewals.getMonthlyStats(year, month);
    revenueFromRenewals = monthlyRenewals.revenue || 0;

    // Sum of all item sales (assuming price * quantity sold)
    const allItems = await Item.findAll();
    const accessoryRevenue = allItems.reduce(
      (sum, item) => sum + (item.price || 0),
      0
    );

    const monthlyIncome = revenueFromRenewals + accessoryRevenue;

    // Placeholder for income growth
    const incomeGrowth = 8;

    res.json({
      activeUsers,
      expiredUsers,
      activeGrowth,
      expiredGrowth,
      monthlyIncome,
      incomeGrowth,
      accessoryRevenue,
      bookings,
      inquiries,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard/staff", async (req, res) => {
  try {
    const staff = await Staff.findAll(); // returns normalized staff
    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/dashboard/recent-activity", async (req, res) => {
  try {
    const newUsers = await User.findAll(); // filter last X period
    const tickets = await SupportTicket.findAll(); // filter last X period

    const recentActivity = [];

    newUsers.slice(-5).forEach((u) => {
      recentActivity.push({
        id: u.id,
        icon: "fa-user-plus",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        title: "New user registration",
        description: `${u.first_name} ${u.second_name} registered as a new client`,
        timeAgo: "2 min ago", // you can calculate dynamically
      });
    });

    tickets.slice(-5).forEach((t) => {
      if (t.status === "resolved") {
        recentActivity.push({
          id: t.id,
          icon: "fa-check",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          title: "Ticket resolved",
          description: t.subject,
          timeAgo: "5 min ago",
        });
      }
    });

    res.json(recentActivity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/dashboard/revenue-trend", async (req, res) => {
  try {
    const period = req.query.period || "monthly";

    if (period === "monthly") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const data = [];
      for (let i = 0; i < 12; i++) {
        const amount = await Payment.sumMonth(i + 1);
        data.push({ month: months[i], amount });
      }
      return res.json(data);
    }

    if (period === "quarterly") {
      const data = [];
      for (let q = 1; q <= 4; q++) {
        const amount = await Payment.sumQuarter(q);
        data.push({ quarter: `Q${q}`, amount });
      }
      return res.json(data);
    }

    res.json([]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Staff Attendance Routes
router.get("/staff", async (req, res) => {
  try {
    const staff = await Staff.findAllWithSalary();
    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

// Create a new staff member
router.post("/staff", async (req, res) => {
  try {
    const data = req.body;

    if (!data.first_name || !data.email) {
      return res
        .status(400)
        .json({ error: "First name and email are required" });
    }

    const result = await Staff.create(data);
    const staffId = result.insertId;

    if (data.basic_salary) {
      await StaffSalary.create({
        staff_id: staffId,
        basic_salary: data.basic_salary,
        effective_from: data.effective_from || new Date(), // default now
        effective_to: data.effective_to || null,
      });
    }

    res.status(201).json({
      message: "Staff member created successfully",
      staffId,
    });
  } catch (err) {
    console.error("Error creating staff:", err);
    res.status(500).json({ error: "Failed to create staff" });
  }
});

// Update a staff record
router.put("/staff/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Optional: Check if staff exists
    const existing = await Staff.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Perform update using model
    const result = await Staff.update(id, updateData);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "No changes made" });
    }

    // Fetch updated record (normalized from model)
    const updatedStaff = await Staff.findById(id);

    res.json({
      message: "Staff updated successfully",
      data: updatedStaff,
    });
  } catch (err) {
    console.error("Error updating staff:", err);
    res.status(500).json({ error: "Failed to update staff" });
  }
});

//Booking Routes
//Get all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await Booking.findAll();
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

// GET a booking by ID
router.get("/bookings/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// CREATE booking
router.post("/bookings/", async (req, res) => {
  try {
    const result = await Booking.create(req.body);
    res.status(201).json({ message: "Booking created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

// UPDATE booking
router.put("/bookings/:id", async (req, res) => {
  try {
    const result = await Booking.update(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update booking" });
  }
});

// DELETE booking
router.delete("/bookings/:id", async (req, res) => {
  try {
    const result = await Booking.delete(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found" });
    res.json({ message: "Booking deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

// Inventory Routes
router.get("/inventory", async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// GET single item
router.get("/inventory/:id", async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

// CREATE item
router.post("/inventory", async (req, res) => {
  try {
    const data = {
      ...req.body,
      added_by: req.session.user?.id || null,
    };

    const result = await Item.create(data);
    const newItem = await Item.findById(result.insertId);
    res.status(201).json(newItem);
  } catch (err) {
    console.error("Error creating item:", err);
    res.status(500).json({ error: "Failed to create item" });
  }
});

// UPDATE item
router.put("/inventory/:id", async (req, res) => {
  try {
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) return res.status(404).json({ error: "Item not found" });

    // Optional validation
    if (
      req.body.available &&
      req.body.available > (req.body.quantity || existingItem.quantity)
    ) {
      return res
        .status(400)
        .json({ error: "Available quantity cannot exceed total quantity" });
    }

    await Item.update(req.params.id, req.body);
    const updatedItem = await Item.findById(req.params.id);
    res.json(updatedItem);
  } catch (err) {
    console.error("Error updating item:", err);
    res.status(500).json({ error: "Failed to update item" });
  }
});

// DELETE item
router.delete("/inventory/:id", async (req, res) => {
  try {
    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) return res.status(404).json({ error: "Item not found" });

    await Item.delete(req.params.id);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("Error deleting item:", err);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Staff Client Assignments Routes
router.get("/assignments", async (req, res) => {
  try {
    const data = await StaffClientAssignment.findAll();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// GET by id
router.get("/assignments/:id", async (req, res) => {
  try {
    const data = await StaffClientAssignment.findById(req.params.id);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// POST create
router.post("/assignments/", async (req, res) => {
  try {
    const result = await StaffClientAssignment.create(req.body);
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// PUT update
router.put("/assignments/:id", async (req, res) => {
  try {
    await StaffClientAssignment.update(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// DELETE
router.delete("/assignments/:id", async (req, res) => {
  try {
    await StaffClientAssignment.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

router.get("/technicians", async (req, res) => {
  try {
    const techs = await Staff.findAll();
    res.json(techs);
  } catch (err) {
    console.error("Error fetching staff:", err);
    res.status(500).json({ error: "Failed to fetch staff" });
  }
});

router.get("/supervisors", async (req, res) => {
  try {
    // const sups = await Staff.findByRole(2);
    const sups = await Staff.findAll();
    res.json(sups);
  } catch (err) {
    console.error("Error fetching supervisors:", err);
    res.status(500).json({ error: "Failed to fetch supervisors" });
  }
});

module.exports = router;
