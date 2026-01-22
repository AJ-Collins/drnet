const express = require("express");
const router = express.Router();
const dayjs = require("dayjs");
const Package = require("../models/Package");
const UserSubscription = require("../models/UserSubscription");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// Get current subscription
router.get("/subscription/current", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const plan = await UserSubscription.getCurrent(userId);

    if (!plan) return res.status(404).json({ error: "User has no active subscription" });

    plan.expires = dayjs(plan.expiry_date).format("YYYY-MM-DD");
    res.json(plan);
  } catch (err) {
    console.error("Error fetching current subscription:", err);
    res.status(500).json({ error: "Failed to fetch subscription" });
  }
});

router.get("/subscription/plans", async (req, res) => {
  try {
    const packages = await Package.findAll();
    res.json(packages);
  } catch (err) {
    console.error("Error fetching packages:", err);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

// Subscribe to a plan
router.post("/subscription/subscribe/:id", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const planId = parseInt(req.params.id);

    const plan = await Package.findById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const startDate = dayjs().format("YYYY-MM-DD");
    const expiryDate = dayjs().add(plan.validity_days, "day").format("YYYY-MM-DD");

    const newSub = await UserSubscription.create(userId, planId, startDate, expiryDate);

    res.json({ ...plan, expires: expiryDate });
  } catch (err) {
    console.error("Error subscribing to plan:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Renew subscription (+X days)
router.post("/subscription/renew", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const currentSub = await UserSubscription.getCurrent(userId);
    if (!currentSub) return res.status(404).json({ error: "No active subscription to renew" });

    const plan = await Package.findById(currentSub.package_id);
    await UserSubscription.renew(currentSub.id, plan.validity_days);

    const renewedSub = await UserSubscription.getCurrent(userId);
    res.json({ ...plan, expires: dayjs(renewedSub.expiry_date).format("YYYY-MM-DD") });
  } catch (err) {
    console.error("Error renewing subscription:", err);
    res.status(500).json({ error: "Failed to renew subscription" });
  }
});

// Upgrade subscription
router.post("/subscription/upgrade/:id", async (req, res) => {
  try {
    const userId = req.session.user.id;
    const newPlanId = parseInt(req.params.id);

    const newPlan = await Package.findById(newPlanId);
    if (!newPlan) return res.status(404).json({ error: "Plan not found" });

    const currentSub = await UserSubscription.getCurrent(userId);
    if (currentSub) {
      const currentPlan = await Package.findById(currentSub.package_id);
      if (currentPlan.price >= newPlan.price) {
        return res.status(400).json({ error: "Cannot downgrade via upgrade" });
      }
    }

    const startDate = dayjs().format("YYYY-MM-DD");
    const expiryDate = dayjs().add(newPlan.validity_days, "day").format("YYYY-MM-DD");

    await UserSubscription.upgrade(userId, newPlanId, startDate, expiryDate);

    res.json({ ...newPlan, expires: expiryDate });
  } catch (err) {
    console.error("Error upgrading subscription:", err);
    res.status(500).json({ error: "Failed to upgrade subscription" });
  }
});

module.exports = router;
