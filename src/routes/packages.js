const express = require("express");
const db = require("../config/db");
const path = require("path");
const router = express.Router();
const Package = require("../models/Package");

//Admin manage packages routes
// GET packages
router.get("/packages", async (req, res) => {
  try {
    const packages = await Package.findAll();
    res.json(packages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
});

router.get("/packages/:id", async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: "Package not found" });
    res.json(pkg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch package" });
  }
});

router.post("/packages/", async (req, res) => {
  try {
    const result = await Package.create(req.body);
    res.status(201).json({ message: "Package created", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create package" });
  }
});

router.put("/packages/:id", async (req, res) => {
  try {
    const result = await Package.update(req.params.id, req.body);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Package not found" });
    res.json({ message: "Package updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update package" });
  }
});

router.delete("/packages/:id", async (req, res) => {
  try {
    const result = await Package.delete(req.params.id);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Package not found" });
    res.json({ message: "Package deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete package" });
  }
});

module.exports = router;
