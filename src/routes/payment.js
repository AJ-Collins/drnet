const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const UserSubscription = require("../models/UserSubscription");

/* -------------------------------------------------------
   GET: M-PESA Payment Method
--------------------------------------------------------- */
router.get("/payment/method", (req, res) => {
  res.json({
    method: "Lipa Na M-PESA",
    type: "Buy Goods",
    till: "5626320",
    business_name: "DR.NET TECHNOLOGY LABS",
  });
});

/* -------------------------------------------------------
   GET: Next Payment Due
--------------------------------------------------------- */
router.get("/payment/next", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const subscription = await UserSubscription.getCurrent(userId);
    if (!subscription) return res.json(null);

    res.json({
      plan: subscription.package_name,
      amount: subscription.price,
      dueDate: subscription.expiry_date,
    });
  } catch (err) {
    console.error("Next payment error:", err);
    res.status(500).json({ error: "Failed to fetch next payment" });
  }
});

/* -------------------------------------------------------
   GET: All Payment Transactions
--------------------------------------------------------- */
router.get("/payment/transactions", async (req, res) => {
  try {
    const userId = req.session.user.id;

    const payments = await Payment.findAllByUser(userId);

    const enriched = await Promise.all(
      payments.map(async (tx) => {
        const pkg = await Package.findById(tx.package_id);

        return {
          id: tx.id,
          transaction_id: tx.transaction_id,
          amount: tx.amount,
          payment_method: tx.payment_method,
          payment_date: tx.payment_date,
          status: tx.status,
          planName: pkg ? pkg.name : "Unknown package",
          description: `Payment for ${pkg ? pkg.name : "Package"}`,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Transaction fetch error:", err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

/* -------------------------------------------------------
   GET: Single Payment Receipt
--------------------------------------------------------- */
router.get("/payment/transactions/receipt/:id", async (req, res) => {
  try {
    const paymentId = req.params.id;
    const userId = req.session.user.id;

    const payment = await Payment.findByIdForUser(paymentId, userId);
    if (!payment) return res.status(404).send("Receipt not found");

    const pkg = await Package.findById(payment.package_id);

    const html = `
      <h1>Payment Receipt</h1>
      <hr>
      <p><strong>Transaction:</strong> ${payment.transaction_id}</p>
      <p><strong>Plan:</strong> ${pkg ? pkg.name : "Package"}</p>
      <p><strong>Amount:</strong> KES ${payment.amount}</p>
      <p><strong>Date:</strong> ${new Date(
        payment.payment_date
      ).toLocaleString()}</p>
      <p><strong>Status:</strong> ${payment.status}</p>
    `;

    res.send(html);
  } catch (err) {
    console.error("Receipt error:", err);
    res.status(500).send("Error generating receipt");
  }
});

module.exports = router;
