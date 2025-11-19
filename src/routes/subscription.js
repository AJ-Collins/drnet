const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const db = require("../config/db");
const Package = require("../models/Package");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");
const Renewals = require("../models/Renewal");
const Payment = require("../models/Payment");

// Renew subscription
router.post("/subscribe/client/renew", async (req, res) => {
  try {
    console.log("=== Renew Request ===");
    const userId = parseInt(req.query.userId, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const currentSub = await UserSubscription.getCurrent(userId);
    if (!currentSub) {
      return res.status(404).json({ error: "No active subscription to renew" });
    }

    if (!currentSub.package_id) {
      return res
        .status(400)
        .json({ error: "Cannot renew. Subscription has no assigned package." });
    }

    const plan = await Package.findById(currentSub.package_id);
    if (!plan) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Keep old values for renewal record
    const oldPackageId = currentSub.package_id;
    const oldExpiry = currentSub.expiry_date;

    // Determine old_amount
    const lastRenewal = await Renewals.getLastBySubscriptionId(currentSub.id);
    const oldAmount = lastRenewal ? lastRenewal.amount : plan.price;

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

    console.log("Subscription renewed successfully");
    console.log("New expiry:", renewedSub.expiry_date);

    res.json({
      success: true,
      package: plan.name,
      expires: dayjs(renewedSub.expiry_date).format("YYYY-MM-DD"),
      ...plan,
    });
  } catch (err) {
    console.error("Error renewing subscription:", err);
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

// Subscribe to a plan - FIXED
router.post("/subscribe/client/:id", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);
    const planId = parseInt(req.params.id, 10);
    const startDateQuery = req.query.start_date;

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

    const startDate = startDateQuery
      ? dayjs(startDateQuery).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
    const expiryDate = dayjs(startDate)
      .add(plan.validity_days, "day")
      .format("YYYY-MM-DD");

    const result = await UserSubscription.create(
      userId,
      planId,
      startDate,
      expiryDate
    );

    // FIX: Get the insertId from the result
    const subscriptionId = result.insertId;
    console.log("Subscription created with ID:", subscriptionId);

    // Now use the subscription_id when creating payment
    await Payment.create({
      user_id: userId,
      package_id: planId,
      subscription_id: subscriptionId,
      transaction_id: req.body.transaction_id || "REFXYZ",
      amount: plan.price,
      payment_method: req.body.payment_method || "mpesa",
      payment_date: startDate,
      notes: null,
      status: "unpaid",
    });

    res.json({ ...plan, expires: expiryDate });
  } catch (err) {
    console.error("Error subscribing to plan:", err);
    res.status(500).json({ error: "Failed to subscribe: " + err.message });
  }
});

// Admin: Get user's current subscription with payment info
router.get("/subscribe/client/current", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId, 10);

    console.log("Admin Get Current - User ID:", userId);

    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Get all subscriptions for this user with payment details
    const [subscriptions] = await db.query(
      `
      SELECT 
        us.id,
        us.user_id,
        us.package_id,
        us.start_date,
        us.expiry_date,
        us.status as subscription_status,
        us.payment_id,
        us.created_at,
        pkg.name as package_name,
        pkg.price,
        pkg.validity_days,
        p.id as payment_id,
        p.amount as payment_amount,
        p.status as payment_status,
        p.payment_method,
        p.payment_date,
        p.transaction_id,
        p.notes as payment_notes
      FROM user_subscriptions us
      LEFT JOIN packages pkg ON us.package_id = pkg.id
      LEFT JOIN payments p ON p.subscription_id = us.id
      WHERE us.user_id = ?
      ORDER BY us.created_at DESC
      `,
      [userId]
    );

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: "User has no subscriptions" });
    }

    // Format the response
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      user_id: sub.user_id,
      package_id: sub.package_id,
      start_date: sub.start_date,
      expiry_date: sub.expiry_date,
      expires: dayjs(sub.expiry_date).format("YYYY-MM-DD"),
      subscription_status: sub.subscription_status,
      created_at: sub.created_at,

      // Package info
      package: {
        name: sub.package_name,
        price: sub.price,
        validity_days: sub.validity_days,
      },

      // Payment info
      payment: sub.payment_id
        ? {
            id: sub.payment_id,
            amount: sub.payment_amount,
            status: sub.payment_status,
            payment_method: sub.payment_method,
            payment_date: sub.payment_date,
            transaction_id: sub.transaction_id,
            notes: sub.payment_notes,
          }
        : null,
    }));

    res.json(formattedSubscriptions);
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch subscriptions: " + err.message });
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
    const history = await UserSubscription.getRenewalHistory(userId);

    if (!history || history.length === 0) {
      return res.status(404).json({ error: "No subscription history found" });
    }

    // Format the response data
    const formattedHistory = history.map((sub) => ({
      id: sub.id,
      subscription_id: sub.subscription_id,
      user_id: sub.user_id,

      // package info
      package_id: sub.package_id,
      package_name: sub.package_name,
      package_price: sub.package_price,
      validity_days: sub.validity_days,

      // old package
      old_package_id: sub.old_package_id,
      old_package_name: sub.old_package_name,

      // amounts
      amount: sub.amount,
      old_amount: sub.old_amount,

      // ONLY the two dates you want
      old_expiry_date: sub.old_expiry_date,
      renewal_date: sub.renewal_date,
      new_expiry_date: sub.new_expiry_date,

      is_deleted: sub.is_deleted,
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
    const renewalId = parseInt(req.params.id, 10);
    if (isNaN(renewalId))
      return res.status(400).json({ error: "Invalid renewal ID" });

    // Get the renewal record
    const renewal = await Renewals.getById(renewalId);
    if (!renewal) return res.status(404).json({ error: "Renewal not found" });

    const subscriptionId = renewal.subscription_id;

    // Rollback the subscription expiry_date to the old expiry
    await UserSubscription.update(subscriptionId, {
      expiry_date: renewal.old_expiry_date,
    });

    // Delete the renewal record
    await Renewals.deleteById(renewalId);

    res.json({
      success: true,
      message: "Renewal reversed successfully",
      oldExpiry: renewal.old_expiry_date,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to reverse renewal", details: err.message });
  }
});

// Update an existing subscription - FIXED
router.put("/subscribe/client/:id", async (req, res) => {
  try {
    const subId = parseInt(req.params.id, 10);
    const { package_id, start_date, payment } = req.body;

    console.log("=== UPDATE REQUEST ===");
    console.log("Subscription ID:", subId);
    console.log("Payment data:", payment);

    if (isNaN(subId)) {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    if (!package_id) {
      return res.status(400).json({ error: "package_id is required" });
    }

    const subscription = await UserSubscription.getById(subId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    const plan = await Package.findById(package_id);
    if (!plan) {
      return res.status(404).json({ error: "Package not found" });
    }

    // Use provided start date or keep old one
    const newStartDate = start_date
      ? dayjs(start_date).format("YYYY-MM-DD")
      : dayjs(subscription.start_date).format("YYYY-MM-DD");

    // Recalculate expiry based on the updated start date + package validity
    const newExpiry = dayjs(newStartDate)
      .add(plan.validity_days, "day")
      .format("YYYY-MM-DD");

    // Update subscription record
    await UserSubscription.update(subId, {
      package_id,
      start_date: newStartDate,
      expiry_date: newExpiry,
    });

    // FIX: Find payment by subscription_id
    const [existingPayments] = await db.query(
      `SELECT id, status FROM payments WHERE subscription_id = ? LIMIT 1`,
      [subId]
    );

    console.log("Existing payments found:", existingPayments);

    if (existingPayments.length > 0) {
      // Prepare update values - IMPORTANT: Don't use default values, use existing values if not provided
      const updateAmount =
        payment?.amount !== undefined ? payment.amount : plan.price;
      const updateMethod = payment?.payment_method || "mpesa";
      const updateTransactionId = payment?.transaction_id || "None";
      const updateDate = payment?.payment_date || newStartDate;
      const updateStatus =
        payment?.status !== undefined
          ? payment.status
          : existingPayments[0].status;

      console.log("Updating payment with status:", updateStatus);

      // Update existing payment
      const [result] = await db.query(
        `
        UPDATE payments
        SET 
          amount = ?,
          payment_method = ?,
          transaction_id = ?,
          payment_date = ?,
          status = ?
        WHERE id = ?
        `,
        [
          updateAmount,
          updateMethod,
          updateTransactionId,
          updateDate,
          updateStatus,
          existingPayments[0].id,
        ]
      );

      console.log("Payment update result:", result);
    } else {
      console.log("No payment found, creating new one");
      // Create new payment if none exists
      await Payment.create({
        user_id: subscription.user_id,
        package_id: package_id,
        subscription_id: subId,
        transaction_id: payment?.transaction_id || "None",
        amount: payment?.amount || plan.price,
        payment_method: payment?.payment_method || "mpesa",
        payment_date: payment?.payment_date || newStartDate,
        notes: null,
        status: payment?.status || "unpaid",
      });
    }

    res.json({
      success: true,
      message: "Subscription updated",
      subscription_id: subId,
      package: plan.name,
      start_date: newStartDate,
      expiry_date: newExpiry,
      payment,
    });
  } catch (err) {
    console.error("Error updating subscription:", err);
    res.status(500).json({
      error: "Failed to update subscription: " + err.message,
    });
  }
});

// Delete user subscription
router.delete("/subscribe/client/:id", async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id, 10);

    console.log("=== DELETE SUBSCRIPTION REQUEST ===");
    console.log("Subscription ID:", subscriptionId);

    if (isNaN(subscriptionId)) {
      return res.status(400).json({ error: "Invalid subscription ID" });
    }

    // Check if subscription exists
    const subscription = await UserSubscription.getById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    // Optional: Delete associated payments first (if you want to delete them)
    // await db.query(`DELETE FROM payments WHERE subscription_id = ?`, [subscriptionId]);

    // Delete the subscription
    const [result] = await db.query(
      `DELETE FROM user_subscriptions WHERE id = ?`,
      [subscriptionId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    console.log("Subscription deleted successfully");

    res.json({
      success: true,
      message: "Subscription deleted successfully",
      subscription_id: subscriptionId,
    });
  } catch (err) {
    console.error("Error deleting subscription:", err);
    res.status(500).json({
      error: "Failed to delete subscription",
      details: err.message,
    });
  }
});

// Delete renewals
router.delete("/subscribe/client/delete/:id", async (req, res) => {
  try {
    const renewalId = parseInt(req.params.id, 10);
    if (isNaN(renewalId))
      return res.status(400).json({ error: "Invalid renewal ID" });

    const result = await UserSubscription.deleteRenewalById(renewalId);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Renewal not found" });
    }

    res.json({ success: true, message: "Renewal deleted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Failed to delete renewal", details: err.message });
  }
});

// Delete payment only
router.delete("/subscribe/client/payment/:id", async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id, 10);

    console.log("=== DELETE PAYMENT REQUEST ===");
    console.log("Payment ID:", paymentId);

    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    // Check if payment exists
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    // Delete the payment
    const deleted = await Payment.delete(paymentId);

    if (!deleted) {
      return res.status(500).json({ error: "Failed to delete payment" });
    }

    console.log("Payment deleted successfully");

    res.json({
      success: true,
      message: "Payment deleted successfully",
      payment_id: paymentId,
    });
  } catch (err) {
    console.error("Error deleting payment:", err);
    res.status(500).json({
      error: "Failed to delete payment",
      details: err.message,
    });
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
