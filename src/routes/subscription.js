const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const db = require("../config/db");
const Package = require("../models/Package");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");
const Renewals = require("../models/Renewal");

// Renew subscription
router.post("/subscribe/client/renew", async (req, res) => {
  try {
    console.log("=== Renew Request ===");
    console.log("Query params:", req.query);

    const userId = parseInt(req.query.userId, 10);

    console.log("Renewing for User ID:", userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const currentSub = await UserSubscription.getCurrent(userId);
    if (!currentSub) {
      return res.status(404).json({ error: "No active subscription to renew" });
    }

    if (!currentSub.package_id) {
      return res.status(400).json({
        error: "Cannot renew. Subscription has no assigned package.",
      });
    }

    const plan = await Package.findById(currentSub.package_id);
    if (!plan) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Keep old values for renewal record
    const oldPackageId = currentSub.package_id;
    const oldExpiry = currentSub.expiry_date;
    const oldAmount = plan.price;

    // Renew subscription (extends expiry date)
    await UserSubscription.renew(currentSub.id, plan.validity_days);

    const renewedSub = await UserSubscription.getCurrent(userId);

    // Insert renewal record
    await Renewals.create({
      subscription_id: currentSub.id,
      user_id: userId,
      package_id: plan.id,
      old_package_id: oldPackageId,
      amount: plan.price,
      old_amount: oldAmount,
      old_expiry_date: oldExpiry,
      new_expiry_date: renewedSub.expiry_date,
    });

    console.log("✓ Subscription renewed successfully");
    console.log("New expiry:", renewedSub.expiry_date);

    res.json({
      success: true,
      package: plan.name,
      expires: dayjs(renewedSub.expiry_date).format("YYYY-MM-DD"),
      ...plan,
    });
  } catch (err) {
    console.error("✗ Error renewing subscription:", err);
    res.status(500).json({
      error: "Failed to renew subscription: " + err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
});

router.post("/subscribe/client/upgrade/:id", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    const newPlanId = parseInt(req.params.id, 10);

    console.log("Admin Upgrade - User ID:", userId, "New Plan ID:", newPlanId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (isNaN(newPlanId)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const newPlan = await Package.findById(newPlanId);
    if (!newPlan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const startDate = dayjs().format("YYYY-MM-DD");
    const expiryDate = dayjs()
      .add(newPlan.validity_days, "day")
      .format("YYYY-MM-DD");

    await UserSubscription.upgrade(userId, newPlanId, startDate, expiryDate);

    console.log("✓ Subscription upgraded successfully");
    res.json({
      success: true,
      ...newPlan,
      expires: expiryDate,
    });
  } catch (err) {
    console.error("✗ Error upgrading subscription:", err);
    res
      .status(500)
      .json({ error: "Failed to upgrade subscription: " + err.message });
  }
});

// Subscribe to a plan
router.post("/subscribe/client/:id", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    const planId = parseInt(req.params.id, 10);

    console.log("Admin Subscribe - User ID:", userId, "Plan ID:", planId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    if (isNaN(planId)) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const plan = await Package.findById(planId);
    if (!plan) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const startDate = dayjs().format("YYYY-MM-DD");
    const expiryDate = dayjs()
      .add(plan.validity_days, "day")
      .format("YYYY-MM-DD");

    const newSub = await UserSubscription.create(
      userId,
      planId,
      startDate,
      expiryDate
    );

    console.log("Subscription created:", newSub);
    res.json({ ...plan, expires: expiryDate });
  } catch (err) {
    console.error("Error subscribing to plan:", err);
    res.status(500).json({ error: "Failed to subscribe: " + err.message });
  }
});

// Admin: Get user's current subscription
router.get("/subscribe/client/current", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);

    console.log("Admin Get Current - User ID:", userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const plan = await UserSubscription.getCurrent(userId);

    if (!plan) {
      return res.status(404).json({ error: "User has no active subscription" });
    }

    plan.expires = dayjs(plan.expiry_date).format("YYYY-MM-DD");
    res.json(plan);
  } catch (err) {
    console.error("Error fetching current subscription:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch subscription: " + err.message });
  }
});

router.get("/subscribe/client/history", async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // Fetch history from database
    const history = await UserSubscription.getHistory(userId);

    if (!history || history.length === 0) {
      return res.status(404).json({ error: "No subscription history found" });
    }

    // Format the response data
    const formattedHistory = history.map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      package_id: sub.package_id,
      package_name: sub.package_name,
      price: sub.price,
      validity_days: sub.validity_days,
      start_date: sub.start_date,
      expiry_date: sub.expiry_date,
      status: sub.status,
      created_at: sub.created_at,
      // Add formatted dates for frontend
      assigned_at: sub.start_date,
      expires: dayjs(sub.expiry_date).format("YYYY-MM-DD"),
    }));

    res.json(formattedHistory);
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    res.status(500).json({
      error: "Failed to fetch subscription history",
      details: error.message,
    });
  }
});

// Reverse subscription
router.post("/subscribe/client/reverse/:id", async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    if (isNaN(subId))
      return res.status(400).json({ error: "Invalid subscription ID" });

    const subscription = await UserSubscription.getById(subId);
    if (!subscription)
      return res.status(404).json({ error: "Subscription not found" });

    const lastRenewal = await Renewals.getLastBySubscriptionId(subId);
    if (!lastRenewal)
      return res.status(400).json({ error: "No renewal history to reverse" });

    // Rollback expiry
    await UserSubscription.update(subId, {
      expiry_date: lastRenewal.old_expiry_date,
    });

    // Delete renewal record
    await Renewals.deleteById(lastRenewal.id);

    res.json({
      success: true,
      message: "Subscription reversed",
      oldExpiry: lastRenewal.old_expiry_date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reverse subscription" });
  }
});

// Delete subscription
router.delete("/subscribe/client/delete/:id", async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    if (isNaN(subId))
      return res.status(400).json({ error: "Invalid subscription ID" });

    await UserSubscription.deleteById(subId);

    res.json({ success: true, message: "Subscription deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

router.get("/renewals/stats", async (req, res) => {
  try {
    const now = dayjs();
    const year = parseInt(req.query.year) || now.year();
    const month = parseInt(req.query.month) || now.month() + 1;

    const stats = await Renewals.getMonthlyStats(year, month);

    res.json({
      monthlyRenewals: Number(stats.count),
      revenue: Number(stats.revenue),
      avgRenewal: Math.round(Number(stats.avg_amount)),
    });
  } catch (err) {
    console.error("Error fetching renewals stats:", err);
    res.status(500).json({ error: "Failed to fetch renewals stats" });
  }
});

module.exports = router;
