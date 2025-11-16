const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/sales
router.get("/sales", async (req, res) => {
  try {
    const [rows] = await db.query(`
        SELECT cip.id, 'router' AS type, cip.total_amount AS amount, cip.purchase_date AS date,
            cip.first_name AS customer, cip.quantity, i.name AS description, cip.notes
        FROM client_item_purchases cip
        JOIN items i ON cip.item_id = i.id
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/sales", async (req, res) => {
  const { type, amount, date, customer, quantity, description, notes } =
    req.body;
  try {
    // Assume item exists or create on-the-fly
    let [item] = await db.query("SELECT id FROM items WHERE name = ?", [
      description,
    ]);
    if (!item.length) {
      const [insItem] = await db.query(
        "INSERT INTO items (name, unit_price, quantity) VALUES (?, ?, ?)",
        [description, amount, 0]
      );
      item = [{ id: insItem.insertId }];
    }

    const [ins] = await db.query(
      `INSERT INTO client_item_purchases
       (first_name, item_id, quantity, total_amount, purchase_date, notes, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'paid')`,
      [customer, item[0].id, quantity, amount * quantity, date, notes]
    );
    res.json({ id: ins.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/sales/:id", async (req, res) => {
  const { id } = req.params;
  const {
    customer, // maps to first_name
    quantity,
    amount, // maps to total_amount
    date, // maps to purchase_date
    notes,
    description, // maps to item_id (lookup needed)
  } = req.body;

  try {
    let itemId;
    if (description) {
      // get the item id from the items table
      const [item] = await db.query("SELECT id FROM items WHERE name = ?", [
        description,
      ]);
      if (!item.length) {
        const [insItem] = await db.query(
          "INSERT INTO items (name, unit_price, quantity) VALUES (?, ?, ?)",
          [description, amount || 0, 0]
        );
        itemId = insItem.insertId;
      } else {
        itemId = item[0].id;
      }
    }

    const [upd] = await db.query(
      `UPDATE client_item_purchases
       SET first_name = ?, quantity = ?, total_amount = ?, purchase_date = ?, notes = ?, item_id = ?
       WHERE id = ?`,
      [customer, quantity, amount, date, notes, itemId, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/sales/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query("DELETE FROM client_item_purchases WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
