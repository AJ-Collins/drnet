const express = require("express");
const router = express.Router();
const db = require("../config/db");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

/* --------------------------------------------
   CREATE INVOICE
--------------------------------------------- */
router.post("/invoices/generate", async (req, res) => {
  const {
    client: { name, phone, email, period, location, dueDate },
    items,
  } = req.body;

  try {
    // 1. Compute totals
    const subtotal = items.reduce((s, i) => s + i.quantity * i.amount, 0);
    const vat = subtotal * 0; // VAT 0%
    const grand_total = subtotal + vat;

    // 2. Create invoice record (no user_id)
    const invoiceNumber = `INV-${Date.now()}`;
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const [inv] = await db.query(
      `INSERT INTO invoices
      (invoice_number, name, billing_period, location, phone, subtotal, vat, grand_total, notes,invoice_date, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        name,
        period,
        location,
        phone,
        subtotal,
        vat,
        grand_total,
        null, // notes
        today, // invoice_date
        dueDate || null, //Due date
      ]
    );

    const invoiceId = inv.insertId;

    // 3. Insert items
    for (const it of items) {
      await db.query(
        `INSERT INTO invoice_items
         (invoice_id, description, quantity, unit_price, total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          invoiceId,
          it.description,
          it.quantity,
          it.amount,
          it.quantity * it.amount,
        ]
      );
    }

    res.json({
      id: invoiceId,
      invoice_number: invoiceNumber,
      subtotal,
      vat,
      grand_total,
    });
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------
   GET ALL INVOICES
--------------------------------------------- */
router.get("/invoices", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        i.id,
        i.invoice_number,
        i.name,
        i.phone,
        i.location,
        i.billing_period,
        i.subtotal,
        i.vat,
        i.grand_total,
        i.created_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'description', ii.description,
            'quantity', ii.quantity,
            'amount', ii.unit_price
          )
        ) AS items
      FROM invoices i
      LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
      GROUP BY i.id
      ORDER BY i.id DESC
    `);

    res.json(
      rows.map((r) => ({
        id: r.id,
        invoice_number: r.invoice_number,
        client: {
          name: r.name,
          phone: r.phone,
          location: r.location,
          period: r.billing_period,
        },
        items: Array.isArray(r.items)
          ? r.items
          : typeof r.items === "string"
          ? JSON.parse(r.items)
          : [],

        subtotal: Number(r.subtotal),
        vat: Number(r.vat),
        total: Number(r.grand_total),
        created_at: r.created_at,
      }))
    );
  } catch (err) {
    console.error("INVOICE FETCH ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------
   GET SINGLE INVOICE
--------------------------------------------- */
router.get("/invoices/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // get invoice
    const [[invoice]] = await db.query(`SELECT * FROM invoices WHERE id = ?`, [
      id,
    ]);

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // get items
    const [items] = await db.query(
      `SELECT description, quantity, unit_price AS amount, total 
       FROM invoice_items 
       WHERE invoice_id = ?`,
      [id]
    );

    res.json({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      client: {
        name: invoice.name,
        phone: invoice.phone,
        location: invoice.location,
        period: invoice.billing_period,
      },
      subtotal: invoice.subtotal,
      vat: invoice.vat,
      total: invoice.grand_total,
      items,
      created_at: invoice.created_at,
      due_date: invoice.due_date,
      notes: invoice.notes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------
   UPDATE INVOICE TOTAL
--------------------------------------------- */
router.patch("/invoices/:id", async (req, res) => {
  const { id } = req.params;
  const { subtotal, vat, total } = req.body;

  try {
    await db.query(
      `UPDATE invoices 
       SET subtotal = ?, vat = ?, grand_total = ?
       WHERE id = ?`,
      [subtotal, vat, total, id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* --------------------------------------------
   DELETE INVOICE
--------------------------------------------- */
router.delete("/invoices/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(`DELETE FROM invoices WHERE id = ?`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
