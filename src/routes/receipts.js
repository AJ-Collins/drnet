const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Helper: format KES (optional, for logs)
const formatKES = (n) =>
  `KES ${Number(n)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

// ========================================
// POST /api/receipts (from existing client)
// ========================================
router.post("/receipts", async (req, res) => {
  const clientId = req.body.client?.id || req.body.clientId;
  const { amount, paymentDate, paymentMethod, transactionRef, note } = req.body;

  if (!clientId || !amount || !paymentDate || !paymentMethod) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Validate client exists
    const [clientRows] = await db.query(
      "SELECT id, first_name, second_name, phone, email, address FROM users WHERE id = ?",
      [clientId]
    );
    if (!clientRows.length) {
      return res.status(404).json({ error: "Client not found" });
    }
    const client = clientRows[0];

    const receiptNumber = `REC-${Date.now()}-${Math.floor(
      Math.random() * 100
    )}`;

    const [ins] = await db.query(
      `INSERT INTO payment_receipts
       (user_id, payment_id, receipt_number, amount, payment_method, receipt_date, transaction_id, note, status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'new')`,
      [
        clientId,
        receiptNumber,
        amount,
        paymentMethod,
        paymentDate,
        transactionRef || null,
        note || null,
      ]
    );

    // Calculate VAT breakdown
    const subtotal = Number(amount) / 1.16;
    const vat = Number(amount) - subtotal;

    res.json({
      id: ins.insertId,
      receiptNumber,
      client: {
        id: client.id,
        name: `${client.first_name} ${client.second_name || ""}`.trim(),
        phone: client.phone,
        email: client.email || null,
        location: client.address || null,
        period: null, // optional – can be added later
      },
      amount: Number(amount),
      subtotal: Number(subtotal.toFixed(2)),
      vat: Number(vat.toFixed(2)),
      paymentDate,
      paymentMethod,
      transactionRef: transactionRef || null,
      note: note || null,
    });
  } catch (err) {
    console.error("POST /receipts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================================
// POST /api/receipts/manual (new client)
// ========================================
router.post("/receipts/manual", async (req, res) => {
  const {
    client: { name, phone, email, location, period },
    amount,
    paymentDate,
    paymentMethod,
    transactionRef,
    note,
  } = req.body;

  if (!name || !phone || !amount || !paymentDate || !paymentMethod) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Find or create client
    let [clientRows] = await db.query(
      "SELECT id, first_name, second_name, email, address FROM users WHERE phone = ?",
      [phone]
    );
    let client;

    if (clientRows.length) {
      client = clientRows[0];
    } else {
      const [ins] = await db.query(
        `INSERT INTO users (first_name, second_name, phone, email, address, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        [
          name.split(" ")[0],
          name.split(" ").slice(1).join(" ") || null,
          phone,
          email || null,
          `${location || ""} - ${period || ""}`.trim() || null,
        ]
      );
      client = {
        id: ins.insertId,
        first_name: name.split(" ")[0],
        second_name: name.split(" ").slice(1).join(" "),
        email,
        address: `${location} - ${period}`,
      };
    }

    const receiptNumber = `REC-${Date.now()}-${Math.floor(
      Math.random() * 100
    )}`;

    const [ins] = await db.query(
      `INSERT INTO payment_receipts
       (user_id, payment_id, receipt_number, amount, payment_method, receipt_date, transaction_id, note, status)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'new')`,
      [
        client.id,
        receiptNumber,
        amount,
        paymentMethod,
        paymentDate,
        transactionRef || null,
        note || null,
      ]
    );

    // VAT breakdown
    const subtotal = Number(amount) / 1.16;
    const vat = Number(amount) - subtotal;

    res.json({
      id: ins.insertId,
      receiptNumber,
      client: {
        id: client.id,
        name: `${client.first_name} ${client.second_name || ""}`.trim(),
        phone,
        email: client.email,
        location: location || null,
        period: period || null,
      },
      amount: Number(amount),
      subtotal: Number(subtotal.toFixed(2)),
      vat: Number(vat.toFixed(2)),
      paymentDate,
      paymentMethod,
      transactionRef: transactionRef || null,
      note: note || null,
    });
  } catch (err) {
    console.error("POST /receipts/manual error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================================
// GET /api/receipts – List all
// ========================================
router.get("/receipts", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        pr.id,
        pr.receipt_number AS receiptNumber,
        pr.amount,
        pr.receipt_date AS paymentDate,
        pr.payment_method AS paymentMethod,
        pr.transaction_id AS transactionRef,
        pr.note,
        u.id AS clientId,
        u.first_name,
        u.second_name,
        u.phone AS clientPhone,
        u.email AS clientEmail,
        u.address AS clientLocation
      FROM payment_receipts pr
      JOIN users u ON pr.user_id = u.id
      ORDER BY pr.receipt_date DESC
    `);

    const formatted = rows.map((r) => {
      const subtotal = r.amount / 1.16;
      const vat = r.amount - subtotal;
      return {
        id: r.id,
        receiptNumber: r.receiptNumber,
        clientName: `${r.first_name} ${r.second_name || ""}`.trim(),
        clientPhone: r.clientPhone,
        amount: Number(r.amount),
        subtotal: Number(subtotal.toFixed(2)),
        vat: Number(vat.toFixed(2)),
        paymentDate: r.paymentDate,
        paymentMethod: r.paymentMethod,
        transactionRef: r.transactionRef,
        note: r.note,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("GET /receipts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================================
// GET /api/receipts/:id – View single receipt
// ========================================
router.get("/receipts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        pr.id,
        pr.receipt_number AS receiptNumber,
        pr.amount,
        pr.receipt_date AS paymentDate,
        pr.payment_method AS paymentMethod,
        pr.transaction_id AS transactionRef,
        pr.note,
        u.id AS clientId,
        u.first_name,
        u.second_name,
        u.phone,
        u.email,
        u.address
      FROM payment_receipts pr
      JOIN users u ON pr.user_id = u.id
      WHERE pr.id = ?
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const r = rows[0];
    const subtotal = Number(r.amount) / 1.16;
    const vat = Number(r.amount) - subtotal;

    res.json({
      id: r.id,
      receiptNumber: r.receiptNumber,
      client: {
        id: r.clientId,
        name: `${r.first_name} ${r.second_name || ""}`.trim(),
        phone: r.phone,
        email: r.email || null,
        location: r.address || null,
        period: null,
      },
      amount: Number(r.amount),
      subtotal: Number(subtotal.toFixed(2)),
      vat: Number(vat.toFixed(2)),
      paymentDate: new Date(r.paymentDate).toISOString().split("T")[0], // YYYY-MM-DD
      paymentMethod: r.paymentMethod,
      transactionRef: r.transactionRef || null,
      note: r.note || null,
    });
  } catch (err) {
    console.error(`GET /receipts/${id} error:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

router.patch("/receipts/:id", async (req, res) => {
  const { id } = req.params;
  const {
    client: { name, phone, email, location, period },
    amount,
    paymentDate,
    paymentMethod,
    transactionRef,
    note,
  } = req.body;

  if (!name || !phone || !amount || !paymentDate || !paymentMethod) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Optional: Update user if phone matches
    const [userRows] = await db.query("SELECT id FROM users WHERE phone = ?", [
      phone,
    ]);

    let userId;
    if (userRows.length) {
      userId = userRows[0].id;
      // Update user details
      await db.query(
        `UPDATE users SET first_name = ?, second_name = ?, email = ?, address = ?
         WHERE id = ?`,
        [
          name.split(" ")[0],
          name.split(" ").slice(1).join(" ") || null,
          email || null,
          `${location || ""} - ${period || ""}`.trim() || null,
          userId,
        ]
      );
    } else {
      // Should not happen in edit, but just in case
      return res.status(404).json({ error: "Client not found" });
    }

    // Update receipt
    const [result] = await db.query(
      `UPDATE payment_receipts SET
         amount = ?, payment_method = ?, receipt_date = ?, transaction_id = ?, note = ?
       WHERE id = ? AND user_id = ?`,
      [
        amount,
        paymentMethod,
        paymentDate,
        transactionRef || null,
        note || null,
        id,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Receipt not found or not editable" });
    }

    res.json({ success: true, id });
  } catch (err) {
    console.error(`PATCH /receipts/${id} error:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

// ========================================
// DELETE /api/receipts/:id
// ========================================
router.delete("/receipts/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM payment_receipts WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Receipt not found" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(`DELETE /receipts/${id} error:`, err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
