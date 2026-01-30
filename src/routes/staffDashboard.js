const express = require("express");
const router = express.Router();
const StaffDashboardModel = require("../models/StaffDashboard");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// API: Get Staff Dashboard Stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const staffId = req.session.user.id;

    const [stats, performance] = await Promise.all([
      StaffDashboardModel.getDashboardStats(staffId),
      StaffDashboardModel.getPerformanceMetrics(staffId)
    ]);

    res.json({
      success: true,
      stats: stats,
      chart: performance
    });

  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ success: false, message: "Server error fetching dashboard data" });
  }
});

module.exports = router;