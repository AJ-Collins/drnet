const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Package = require("../models/Package");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

// GET /api/clients
router.get("/clients", async (req, res) => {
  try {
    const clients = await User.findAll();

    const formattedClients = clients.map((client) => ({
      id: client.id,
      name: `${client.first_name || ""} ${client.second_name || ""}`.trim() || "No Name",
      email: client.email || "No Email",
      phone: client.phone || "N/A",
      idNumber: client.id_number,
      address: client.address,
      // Now using the joined package name
      plan: client.subscription_plan || "No Plan", 
      status: client.is_active ? "Active" : "Inactive",
      // Keep other metadata
      paymentStatus: client.subscription_status || "inactive",
      expiryDate: client.plan_expiry,
      ...client,
    }));

    res.json(formattedClients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

// POST /api/clients
router.post("/clients", async (req, res) => {
  try {
    const { first_name, second_name, email, phone, idNumber, address, password, plan } = req.body;

    if (!first_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await User.create({
      first_name,
      second_name,
      email,
      phone,
      id_number: idNumber,
      address,
      password: hashedPassword,
      is_active: true
    });

    const newUserId = result.insertId;

    // If a plan was selected, create the subscription entry immediately
    if (plan) {
      await db.query(
        `INSERT INTO user_subscriptions (user_id, package_id, status, start_date) VALUES (?, ?, ?, NOW())`,
        [newUserId, parseInt(plan, 10), 'active']
      );
    }

    res.status(201).json({ message: "Client created and subscribed", id: newUserId });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Update client data
router.put("/clients/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Map frontend keys to database columns
    const dbUpdate = {};
    if (updateData.first_name) dbUpdate.first_name = updateData.first_name;
    if (updateData.second_name) dbUpdate.second_name = updateData.second_name;
    if (updateData.email) dbUpdate.email = updateData.email;
    if (updateData.phone) dbUpdate.phone = updateData.phone;
    if (updateData.idNumber) dbUpdate.id_number = updateData.idNumber;
    if (updateData.address) dbUpdate.address = updateData.address;
    if (updateData.plan) dbUpdate.package_id = parseInt(updateData.plan, 10);
    if (updateData.password) {
      dbUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    // Perform update via model
    const result = await User.update(id, dbUpdate);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "No changes made" });
    }

    // Get the updated client
    const updatedUser = await User.findById(id);

    // Format for frontend
    const formattedClient = {
      id: updatedUser.id,
      name:
        `${updatedUser.first_name || ""} ${
          updatedUser.second_name || ""
        }`.trim() || "No Name",
      email: updatedUser.email || "No Email",
      phone: updatedUser.phone || "N/A",
      idNumber: updatedUser.id_number || "",
      address: updatedUser.address || "",
      plan: updatedUser.package_id,
      status: updatedUser.is_active ? "Active" : "Inactive",
      lastPayment: updatedUser.debt || "0.00",
      paymentStatus: updatedUser.paid_subscription ? "Paid" : "Unpaid",
    };

    res.json({
      message: "Client updated successfully",
      data: formattedClient,
    });
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/clients/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Check if user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Delete the user
    const result = await User.delete(id);

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: "Failed to delete client" });
    }

    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

module.exports = router;
