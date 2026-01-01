// Add this TEMPORARY route to your staffRoutes.js
// This will manually reset your password with the correct bcrypt hash
// REMOVE THIS ROUTE after fixing your password!
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const SALT_ROUNDS = 12;
const router = express.Router();

router.post("/manual-reset-password", async (req, res) => {
  try {
    const { staffId, newPassword } = req.body;
    
    if (!staffId || !newPassword) {
      return res.status(400).json({ 
        message: "staffId and newPassword are required" 
      });
    }

    console.log("=== MANUAL PASSWORD RESET ===");
    console.log("Staff ID:", staffId);
    console.log("New password:", newPassword);
    
    // Hash with bcrypt and 12 salt rounds (matching authRoutes)
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    console.log("Generated hash:", hashedPassword.substring(0, 30) + "...");
    console.log("Hash algorithm:", hashedPassword.substring(0, 4));
    console.log("Hash length:", hashedPassword.length);
    
    // Update directly in database
    const [result] = await db.query(
      "UPDATE staff SET password = ? WHERE id = ?",
      [hashedPassword, staffId]
    );
    
    console.log("Update result:", result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        message: "Staff member not found" 
      });
    }
    
    // Verify the update
    const [staff] = await db.query(
      "SELECT id, email, password FROM staff WHERE id = ?",
      [staffId]
    );
    
    console.log("Verification:");
    console.log("- Email:", staff[0].email);
    console.log("- Password hash:", staff[0].password.substring(0, 30) + "...");
    
    // Test the new password immediately
    const testMatch = await bcrypt.compare(newPassword, staff[0].password);
    console.log("- Test comparison:", testMatch);
    
    return res.json({ 
      message: "Password reset successfully",
      canLogin: testMatch,
      email: staff[0].email
    });
    
  } catch (err) {
    console.error("Manual reset error:", err);
    return res.status(500).json({ 
      message: "Error: " + err.message 
    });
  }
});