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
const UserSubscription = require("../models/UserSubscription");
const db = require("../config/db");

async function getActiveUsersCount(month, year) {
  const [result] = await db.query(
    `
    SELECT COUNT(DISTINCT us.user_id) AS count
    FROM user_subscriptions us
    INNER JOIN payments pay
      ON pay.user_id = us.user_id
     AND pay.package_id = us.package_id
     AND pay.status = 'paid'
     AND MONTH(pay.payment_date) = ?
     AND YEAR(pay.payment_date) = ?
    `,
    [month, year]
  );
  return result[0]?.count || 0;
}

// Get monthly subscription revenue from payments
async function getMonthlySubscriptionRevenue(month, year) {
  const [result] = await db.query(
    `
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM payments
    WHERE status = 'paid'
      AND MONTH(payment_date) = ?
      AND YEAR(payment_date) = ?
    `,
    [month, year]
  );
  return Number(result[0]?.revenue || 0);
}

// Get monthly items sales revenue using created_at timestamp
async function getMonthlyItemsSales(month, year) {
  const [result] = await db.query(
    `
    SELECT COALESCE(SUM(total_amount), 0) AS revenue
    FROM client_item_purchases
    WHERE MONTH(purchase_date) = ?
      AND YEAR(purchase_date) = ?
      AND payment_status = 'paid'
    `,
    [month, year]
  );
  return Number(result[0]?.revenue || 0);
}

router.get("/dashboard/stats", async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevMonthYear = month === 1 ? year - 1 : year;

    // CURRENT active users
    const activeUsers = await getActiveUsersCount(month, year);
    const prevActiveUsers = await getActiveUsersCount(prevMonth, prevMonthYear);

    // Calculate growth (%) - FIXED
    let activeGrowth = 0;
    if (prevActiveUsers === 0 && activeUsers > 0) {
      activeGrowth = 100;
    } else if (prevActiveUsers > 0) {
      activeGrowth = ((activeUsers - prevActiveUsers) / prevActiveUsers) * 100;
    }

    // Expired users = total users - active users
    const allUsers = await User.findAll();
    const expiredUsers = allUsers.length - activeUsers;

    // Expired users growth (%) - FIXED
    const prevExpiredUsers = allUsers.length - prevActiveUsers;
    let expiredGrowth = 0;
    if (prevExpiredUsers === 0 && expiredUsers > 0) {
      expiredGrowth = 100;
    } else if (prevExpiredUsers > 0) {
      expiredGrowth =
        ((expiredUsers - prevExpiredUsers) / prevExpiredUsers) * 100;
    }

    // BOOKINGS count
    const allBookings = await Booking.findAll();
    const bookings = allBookings.length;

    // SUPPORT INQUIRIES
    const allTickets = await SupportTicket.findAll();
    const inquiries = allTickets.length;

    // ===== REVENUE CALCULATION - FIXED =====

    // 1. Renewals revenue for current month
    const monthlyRenewals = await Renewals.getMonthlyStats(year, month);
    const revenueFromRenewals = Number(monthlyRenewals.revenue || 0);

    // 2. Subscription payments revenue for current month
    const subscriptionRevenue = await getMonthlySubscriptionRevenue(
      month,
      year
    );

    // 3. Items sales revenue for current month
    const itemsSalesRevenue = await getMonthlyItemsSales(month, year);

    // Total monthly income
    const monthlyIncome =
      revenueFromRenewals + subscriptionRevenue + itemsSalesRevenue;

    // ===== PREVIOUS MONTH INCOME =====
    const prevRenewals = await Renewals.getMonthlyStats(
      prevMonthYear,
      prevMonth
    );
    const prevRevenueFromRenewals = Number(prevRenewals.revenue || 0);
    const prevSubscriptionRevenue = await getMonthlySubscriptionRevenue(
      prevMonth,
      prevMonthYear
    );
    const prevItemsSalesRevenue = await getMonthlyItemsSales(
      prevMonth,
      prevMonthYear
    );

    const prevMonthIncome =
      prevRevenueFromRenewals + prevSubscriptionRevenue + prevItemsSalesRevenue;

    // Income growth (%)
    let incomeGrowth = 0;
    if (prevMonthIncome === 0 && monthlyIncome > 0) {
      incomeGrowth = 100;
    } else if (prevMonthIncome > 0) {
      incomeGrowth =
        ((monthlyIncome - prevMonthIncome) / prevMonthIncome) * 100;
    }

    res.json({
      activeUsers,
      expiredUsers,
      activeGrowth: activeGrowth.toFixed(2),
      expiredGrowth: expiredGrowth.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(3),
      incomeGrowth: incomeGrowth.toFixed(2),
      // Breakdown for debugging/frontend display
      itemsSales: itemsSalesRevenue.toFixed(2),
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
    const now = new Date();
    const currentYear = now.getFullYear();

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
        const month = i + 1;

        // 1. Renewals revenue
        const renewals = await Renewals.getMonthlyStats(currentYear, month);
        const renewalsRevenue = Number(renewals.revenue || 0);

        // 2. Subscription revenue
        const subscriptionRevenue = await getMonthlySubscriptionRevenue(
          month,
          currentYear
        );

        // 3. Items sales revenue
        const itemsSalesRevenue = await getMonthlyItemsSales(
          month,
          currentYear
        );

        // TOTAL for the month
        const totalRevenue =
          renewalsRevenue + subscriptionRevenue + itemsSalesRevenue;

        data.push({
          month: months[i],
          amount: totalRevenue.toFixed(2),
          breakdown: {
            renewals: renewalsRevenue,
            subscriptions: subscriptionRevenue,
            items: itemsSalesRevenue,
          },
        });
      }

      return res.json(data);
    }

    // QUARTERLY (same idea)
    if (period === "quarterly") {
      const data = [];

      for (let q = 1; q <= 4; q++) {
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = startMonth + 2;

        let total = 0;

        for (let m = startMonth; m <= endMonth; m++) {
          const renewals = await Renewals.getMonthlyStats(currentYear, m);
          const renewalsRevenue = Number(renewals.revenue || 0);

          const subscriptionRevenue = await getMonthlySubscriptionRevenue(
            m,
            currentYear
          );

          const itemsSalesRevenue = await getMonthlyItemsSales(m, currentYear);

          total += renewalsRevenue + subscriptionRevenue + itemsSalesRevenue;
        }

        data.push({ quarter: `Q${q}`, amount: total.toFixed(2) });
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

//Get staff roles
router.get("/roles", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name FROM roles ORDER BY name
    `);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching roles:", err);
    res.status(500).json({ success: false, message: "Failed to load roles" });
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
router.post("/assignments", async (req, res) => {
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

router.delete("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if staff exists
    const existing = await Staff.findById(id);
    if (!existing) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Delete staff
    const result = await Staff.delete(id);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Failed to delete staff member" });
    }

    res.json({ success: true, message: "Staff member deleted successfully" });
  } catch (err) {
    console.error("Error deleting staff:", err);
    res.status(500).json({ error: "Server error while deleting staff" });
  }
});


module.exports = router;
