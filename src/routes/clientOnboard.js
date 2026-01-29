const express = require("express");
const router = express.Router();
const Client = require("../models/ClientOnboard");
const apiSessionAuth = require("../middleware/apiSessionAuth");

router.use(apiSessionAuth);

/**
 * @route   POST /api/onboard/client
 * @desc    Create a new client
 */
router.post("/client", async (req, res) => {
  try {

    const staffId = req.session.user.id; 

    if (!staffId) {
      return res.status(401).json({ message: "Unauthorized: Staff User not found. Try again" });
    }

    const result = await Client.create(req.body, staffId);
    res.status(201).json({ 
      success: true, 
      message: "Client onboarded successfully", 
      clientId: result.insertId,
      ownerId: staffId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/onboard/my-clients
 * @desc    Get all clients belonging to the owner staff
 */
router.get("/my-clients", async (req, res) => {
  try {
    const staffId = req.session.user.id;
    const clients = await Client.getByStaff(staffId);
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/onboard/clients
 * @desc    Get all clients
 */
router.get("/clients", async (req, res) => {
  try {
    const clients = await Client.getAll();
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   GET /api/onboard/client/:id
 * @desc    Get a single client by ID
 */
router.get("/client/:id", async (req, res) => {
  try {
    const client = await Client.getById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   PUT /api/onboard/client/:id
 * @desc    Update a client
 */
router.put("/client/:id", async (req, res) => {
  try {
    await Client.update(req.params.id, req.body);
    res.status(200).json({ message: "Client updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PATCH /api/onboard/client/:id/status
 * @desc  Updating the status
 */
router.patch("/client/:id/status", async (req, res) => {
  try {
    const { status } = req.body; // e.g., 'active'
    await Client.updateStatus(req.params.id, status);
    res.status(200).json({ message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   DELETE /api/onboard/client/:id
 * @desc    Delete a client
 */
router.delete("/client/:id", async (req, res) => {
  try {
    await Client.delete(req.params.id);
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Commission management
/**
 * GET /api/commissions
 * Fetch the full ledger of all commissions awarded
 */
router.get("/commissions", async (req, res) => {
  try {
    const data = await Client.getAllWithDetails();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/commissions/summary
 * Fetch a summary of how much each staff member is owed vs paid
 */
router.get("/commissions/summary", async (req, res) => {
  try {
    const summary = await Client.getStaffEarnings();
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/commissions/:id/pay
 * Mark a commission as 'paid'
 */
router.patch("/commissions/:id/pay", async (req, res) => {
  try {
    const { status } = req.body;
    await Client.updatePaymentStatus(req.params.id, status);
    res.status(200).json({ message: `Commission marked as ${status}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route   POST /api/onboard/commissions/award
 * @desc    Admin awards a commission to staff for a client onboard
 */
router.post("/commissions/award", async (req, res) => {
  try {
    const { onboard_id, amount } = req.body;
    
    // Validate input
    if (!onboard_id || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Onboard ID and amount are required" 
      });
    }

    // Get the client to find the staff_id
    const client = await Client.getById(onboard_id);
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        message: "Client onboard not found" 
      });
    }

    // Award the commission
    const result = await Client.awardCommission(onboard_id, client.staff_id, amount);
    
    res.status(201).json({ 
      success: true, 
      message: "Commission awarded successfully",
      commissionId: result.insertId
    });
  } catch (error) {
    console.error("Error awarding commission:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;