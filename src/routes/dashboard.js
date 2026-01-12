const express = require("express");
const router = express.Router();
const Dashboard = require("../models/Dashboard");

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const summary = await Dashboard.getSummary();
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
      error: error.message
    });
  }
});

// GET /api/dashboard/metrics
router.get("/metrics", async (req, res) => {
  try {
    const metrics = await Dashboard.getExpandedMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard metrics",
      error: error.message
    });
  }
});

// GET /api/dashboard/performance
router.get("/performance", async (req, res) => {
  try {
    const performance = await Dashboard.getPerformanceComparison();
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error("Dashboard performance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load performance data",
      error: error.message
    });
  }
});

// GET /api/dashboard/recent-activity
router.get("/recent-activity", async (req, res) => {
  try {
    const db = require("../config/db");
    
    // Get recent activities from multiple tables
    const [recentActivities] = await db.query(`
      (SELECT 
        'payment' as type,
        CONCAT('Payment from ', u.first_name, ' ', u.second_name) as description,
        p.payment_date as date,
        p.amount,
        NULL as status,
        CONCAT('/payments/', p.id) as link
      FROM payments p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'paid'
      ORDER BY p.payment_date DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'booking' as type,
        CONCAT('New booking from ', b.name) as description,
        b.created_at as date,
        NULL as amount,
        b.status,
        CONCAT('/bookings/', b.id) as link
      FROM bookings b
      ORDER BY b.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'ticket' as type,
        CONCAT('Support ticket #', t.ticket_number) as description,
        t.created_at as date,
        NULL as amount,
        t.status,
        CONCAT('/support/tickets/', t.id) as link
      FROM support_tickets t
      ORDER BY t.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'subscription' as type,
        CONCAT('New subscription for ', u.first_name, ' ', u.second_name) as description,
        us.start_date as date,
        p.price as amount,
        us.status,
        CONCAT('/subscriptions/', us.id) as link
      FROM user_subscriptions us
      JOIN users u ON us.user_id = u.id
      JOIN packages p ON us.package_id = p.id
      ORDER BY us.start_date DESC
      LIMIT 5)
      
      ORDER BY date DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: recentActivities
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load recent activity",
      error: error.message
    });
  }
});

module.exports = router;