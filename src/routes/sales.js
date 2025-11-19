const express = require("express");
const router = express.Router();
const db = require("../config/db");

// GET /api/sales
router.get("/sales", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        cip.*,
        i.id AS item_id,
        i.name AS item_name,
        i.serial_number,
        i.category,
        i.quantity AS item_quantity,
        i.brand,
        i.unit_price,
        i.status AS item_status,
        i.added_by,
        i.description AS item_description,
        i.created_at AS item_created_at,
        i.updated_at AS item_updated_at
      FROM client_item_purchases cip
      JOIN items i ON cip.item_id = i.id
      ORDER BY cip.purchase_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/sales", async (req, res) => {
  const {
    type,
    amount,
    date,
    customer,
    quantity,
    description,
    notes,
    item_id,
  } = req.body;

  try {
    // Validate required fields
    if (!customer) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: "Valid quantity is required" });
    }
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }

    let finalItemId;

    // Check if item_id is provided and is numeric
    if (item_id && !isNaN(item_id)) {
      // Use existing item_id
      const [existingItem] = await db.query(
        "SELECT id FROM items WHERE id = ?",
        [item_id]
      );
      if (existingItem.length) {
        finalItemId = item_id;
      } else {
        return res.status(400).json({ error: "Item not found" });
      }
    } else if (description && description.trim()) {
      // Create new item or find by name (description)
      let [item] = await db.query("SELECT * FROM items WHERE name = ?", [
        description.trim(),
      ]);

      if (!item.length) {
        // Insert new item record
        const [insItem] = await db.query(
          `INSERT INTO items 
            (name, category, unit_price, quantity, status, description) 
           VALUES (?, ?, ?, ?, 'available', ?)`,
          [
            description.trim(),
            type || "General",
            amount,
            quantity,
            description.trim(),
          ]
        );
        finalItemId = insItem.insertId;
      } else {
        // Update existing item quantity
        await db.query(
          `UPDATE items SET unit_price=?, quantity=quantity+? WHERE id=?`,
          [amount, quantity, item[0].id]
        );
        finalItemId = item[0].id;
      }
    } else {
      return res.status(400).json({
        error: "Either item_id or description is required",
      });
    }

    // Insert purchase record
    const [ins] = await db.query(
      `INSERT INTO client_item_purchases
       (first_name, item_id, quantity, total_amount, purchase_date, notes, payment_status)
       VALUES (?, ?, ?, ?, ?, ?, 'paid')`,
      [
        customer,
        finalItemId,
        quantity,
        amount * quantity,
        date || new Date(),
        notes || "",
      ]
    );

    res.json({
      id: ins.insertId,
      item_id: finalItemId,
      message: "Sale recorded successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.patch("/sales/:id", async (req, res) => {
  const { id } = req.params;
  const {
    customer, // maps to first_name
    quantity,
    amount, // unit price or total_amount
    date, // maps to purchase_date
    notes,
    description, // maps to item name (lookup needed)
    item_id, // direct item_id
  } = req.body;

  try {
    let finalItemId;

    // Check if item_id is provided and is numeric
    if (item_id && !isNaN(item_id)) {
      const [existingItem] = await db.query(
        "SELECT id FROM items WHERE id = ?",
        [item_id]
      );
      if (existingItem.length) {
        finalItemId = item_id;
      } else {
        return res.status(400).json({ error: "Item not found" });
      }
    } else if (description && description.trim()) {
      // Get or create item by name
      const [item] = await db.query("SELECT id FROM items WHERE name = ?", [
        description.trim(),
      ]);

      if (!item.length) {
        const [insItem] = await db.query(
          "INSERT INTO items (name, unit_price, quantity, status) VALUES (?, ?, ?, 'available')",
          [description.trim(), amount || 0, quantity || 0]
        );
        finalItemId = insItem.insertId;
      } else {
        finalItemId = item[0].id;
      }
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (customer) {
      updates.push("first_name = ?");
      values.push(customer);
    }
    if (quantity) {
      updates.push("quantity = ?");
      values.push(quantity);
    }
    if (amount) {
      updates.push("total_amount = ?");
      values.push(amount);
    }
    if (date) {
      updates.push("purchase_date = ?");
      values.push(date);
    }
    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
    }
    if (finalItemId) {
      updates.push("item_id = ?");
      values.push(finalItemId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(id);

    const [upd] = await db.query(
      `UPDATE client_item_purchases SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    res.json({ success: true, affectedRows: upd.affectedRows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.delete("/sales/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query(
      "DELETE FROM client_item_purchases WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Sale not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
