const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const bcrypt = require("bcrypt");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("../config/db");

const SALT_ROUNDS = 12;

// Configure multer for uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (types.test(ext)) cb(null, true);
    else cb(new Error("Invalid image type"));
  },
});

// GET profile
router.get("/profile", async (req, res) => {
  try {
    const profile = await Staff.findById(req.session.user.id);
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE profile
router.put("/profile", async (req, res) => {
  try {
    const updates = {};

    if (req.body.name) {
      // Split full name into first + second
      const parts = req.body.name.trim().split(" ");
      updates.first_name = parts[0];
      updates.second_name = parts.slice(1).join(" ") || "";
    }
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.title) updates.position = req.body.title;
    if (req.body.department) updates.department = req.body.department;

    // Only include columns that actually exist in the table
    await Staff.update(req.session.user.id, updates);
    const profile = await Staff.findById(req.session.user.id);
    res.json({ message: "Profile updated", profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD profile image
router.post(
  "/upload-profile-image",
  upload.single("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const ext = path.extname(req.file.originalname);
    const newPath = `uploads/profile-${Date.now()}${ext}`;
    fs.renameSync(req.file.path, newPath);

    const imageUrl = `${req.protocol}://${req.get("host")}/${newPath}`;

    await Staff.update(req.session.user.id, { image: imageUrl });

    res.json({ message: "Image uploaded", imageUrl });
  }
);

// CHANGE password
router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  try {
    // 1. Validate inputs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Current password and new password are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters" 
      });
    }
    
    if (!req.session?.user?.id) {
      return res.status(401).json({ 
        message: "Not authenticated" 
      });
    }

    // 3. Fetch staff with password
    const staff = await Staff.findByIdRaw(req.session.user.id);

    if (!staff) {
      return res.status(404).json({ 
        message: "Staff member not found" 
      });
    }

    if (!staff.password) {
      return res.status(400).json({ 
        message: "No password set for this account" 
      });
    }

    // 4. Verify current password
    const match = await bcrypt.compare(currentPassword, staff.password);
    
    if (!match) {
      return res.status(401).json({ 
        message: "Current password is incorrect" 
      });
    }

    // 5. Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await db.query("UPDATE staff SET password = ? WHERE id = ?", [hashedPassword, req.session.user.id]);

    res.json({ 
      message: "Password changed successfully" 
    });

  } catch (err) {
    res.status(500).json({ 
      message: "Server error: " + err.message 
    });
  }
});

module.exports = router;
