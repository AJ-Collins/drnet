const express = require("express");
const router = express.Router();

const Payment = require("../models/Payment");
const Package = require("../models/Package");
const UserSubscription = require("../models/UserSubscription");
const path = require("path"); 
const fs = require("fs");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

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
    if (!payment) {
      return res.status(404).send("Receipt not found");
    }

    const pkg = await Package.findById(payment.package_id);

    // Generate clean HTML receipt
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt ${payment.transaction_id || payment._id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: white; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 40px; }
          h1 { text-align: center; color: #1a1a1a; margin-bottom: 30px; }
          hr { border: 1px solid #eee; margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 12px 0; font-size: 16px; }
          .label { font-weight: bold; color: #444; width: 40%; }
          .value { color: #1a1a1a; }
          .footer { margin-top: 60px; text-align: center; color: #777; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="receipt">
          <h1>Payment Receipt</h1>
          <hr>
          <table>
            <tr><td class="label">Transaction ID</td><td class="value">${payment.transaction_id || payment._id}</td></tr>
            <tr><td class="label">Plan</td><td class="value">${pkg ? pkg.name : 'N/A'}</td></tr>
            <tr><td class="label">Amount</td><td class="value">KES ${Number(payment.amount).toLocaleString()}</td></tr>
            <tr><td class="label">Date</td><td class="value">${new Date(payment.payment_date).toLocaleString('en-GB')}</td></tr>
            <tr><td class="label">Status</td><td class="value">${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</td></tr>
          </table>
          <div class="footer">
            <strong>DR.NET TECHNOLOGY LABS</strong><br>
            drnet.co.ke
          </div>
        </div>
      </body>
      </html>
    `;

    // Write HTML to temporary file
    const tempHtmlPath = path.join('/tmp', `receipt_${payment._id}.html`);
    const tempPdfPath = path.join('/tmp', `receipt_${payment._id}.pdf`);

    fs.writeFileSync(tempHtmlPath, htmlContent);

    // Find Chrome/Chromium (works on Render, Railway, Fly.io, Ubuntu, etc.)
    const chromePaths = [
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
      process.env.CHROME_BIN // some platforms set this
    ].filter(Boolean);

    let chromeExecutable = chromePaths.find(p => fs.existsSync(p));

    if (!chromeExecutable) {
      throw new Error("Chrome/Chromium not found on server");
    }

    // Generate PDF using headless Chrome
    await execFileAsync(chromeExecutable, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--print-to-pdf=' + tempPdfPath,
      '--no-pdf-header-footer',
      '--virtual-time-budget=5000',
      `data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`
    ]);

    // Set proper headers
    const fileName = `receipt_${payment.transaction_id || payment._id}_${new Date(payment.payment_date).toISOString().slice(0,10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the PDF back
    const pdfStream = fs.createReadStream(tempPdfPath);
    pdfStream.pipe(res);

    // Clean up temp files after sending
    res.on('finish', () => {
      fs.unlink(tempHtmlPath, () => {});
      fs.unlink(tempPdfPath, () => {});
    });

  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("Failed to generate PDF receipt");
  }
});

module.exports = router;
