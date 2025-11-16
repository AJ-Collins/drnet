const express = require("express");
const router = express.Router();
const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

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

// GET admin profile
router.get("/profile", async (req, res) => {
  try {
    const profile = await Staff.findById(req.session.user.id);
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE admin profile
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
    // Use raw fetch to get password
    const staff = await Staff.findByIdRaw(req.session.user.id);

    if (!staff || !staff.password) {
      return res
        .status(400)
        .json({ message: "Staff not found or password missing" });
    }

    // Compare current password
    const match = await bcrypt.compare(currentPassword, staff.password);
    if (!match) {
      return res.status(401).json({ message: "Current password incorrect" });
    }

    // Hash new password and update
    const hashed = await bcrypt.hash(newPassword, 10);
    await Staff.update(req.session.user.id, { password: hashed });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
