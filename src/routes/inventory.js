const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

// GET all records
router.get("/inventory", async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Fetch failed" });
  }
});

// CREATE (Bulk Serial Input)
router.post("/inventory", async (req, res) => {
  try {
    const data = { ...req.body, added_by: req.session.user?.id || null };
    await Item.createBulk(data);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Serial number duplicate" });
    res.status(500).json({ error: "Creation failed" });
  }
});

// UPDATE Details
router.put("/inventory/:id", async (req, res) => {
  try {
    await Item.update(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// DELETE
router.delete("/inventory/:id", async (req, res) => {
  try {
    await Item.delete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;