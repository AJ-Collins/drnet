const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const Package = require("../models/Package");

async function getPackageName(packageId) {
  if (!packageId) return "No Plan";
  const pkg = await Package.findById(packageId);
  return pkg ? pkg.name : "No Plan";
}

router.get("/clients", async (req, res) => {
  try {
    const clients = await User.findAll();

    // Transform the data to match frontend expectations
    const formattedClients = await Promise.all(
      clients.map(async (client) => ({
        id: client.id,
        name:
          `${client.first_name || ""} ${client.second_name || ""}`.trim() ||
          "No Name",
        email: client.email || "No Email",
        phone: client.phone || "N/A",
        idNumber: client.id_number,
        address: client.address,
        plan: await getPackageName(client.package_id),
        status: client.is_active ? "Active" : "Inactive",
        lastPayment: client.debt || "0.00",
        paymentStatus: client.paid_subscription ? "Paid" : "Unpaid",
        ...client,
      }))
    );

    res.json(formattedClients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.post("/clients", async (req, res) => {
  try {
    const {
      first_name,
      second_name,
      email,
      phone,
      idNumber,
      address,
      password,
      plan,
    } = req.body;

    // Validate required fields
    if (!first_name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await User.create({
      first_name,
      second_name,
      email,
      phone,
      id_number: idNumber,
      address,
      password: hashedPassword,
      role_id: null, // clients may not have a role
      package_id: plan ? parseInt(plan, 10) : null,
      paid_subscription: false,
      last_payment_date: null,
      expiry_date: null,
      debt: 0,
      router_purchased: false,
      router_cost: 0,
      image: null,
      is_active: true,
    });

    res.status(201).json({ message: "Client created", id: newUser.insertId });
  } catch (err) {
    console.error("Error creating client:", err);
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
