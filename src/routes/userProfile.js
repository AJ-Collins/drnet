const express = require("express");
const router = express.Router();
const User = require("../models/User");
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

// Helper: Get raw user for password operations
User.findByIdRaw = async (id) => {
  const user = await User.findById(id);
  return user;
};

// GET user profile
router.get("/my/profile", async (req, res) => {
  try {
    const profile = await User.findById(req.session.user.id);
    if (!profile) return res.status(404).json({ message: "User not found" });
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE user profile
router.put("/my/profile", async (req, res) => {
  try {
    const updates = {};

    if (req.body.name) {
      const parts = req.body.name.trim().split(" ");
      updates.first_name = parts[0];
      updates.second_name = parts.slice(1).join(" ") || "";
    }
    if (req.body.email) updates.email = req.body.email;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.address) updates.address = req.body.address;

    await User.update(req.session.user.id, updates);
    const profile = await User.findById(req.session.user.id);
    res.json({ message: "Profile updated", profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// UPLOAD profile image
router.post(
  "/my/upload-profile-image",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ message: "No file uploaded" });

      const ext = path.extname(req.file.originalname);
      const newPath = `uploads/profile-${Date.now()}${ext}`;
      fs.renameSync(req.file.path, newPath);

      const imageUrl = `${req.protocol}://${req.get("host")}/${newPath}`;

      await User.update(req.session.user.id, { image: imageUrl });

      res.json({ message: "Image uploaded", imageUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// CHANGE password
router.post("/my/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findByIdRaw(req.session.user.id);
    if (!user || !user.password) {
      return res
        .status(400)
        .json({ message: "User not found or password missing" });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match)
      return res.status(401).json({ message: "Current password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.update(req.session.user.id, { password: hashed });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
