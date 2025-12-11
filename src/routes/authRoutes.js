const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

console.log("✅ authRoutes loaded");

//Client Registration
router.post("/register", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Basic validation
    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const emailMatch = identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    let email = null,
      phone = null,
      id_number = null;

    if (emailMatch) {
      email = identifier;
    } else if (identifier.startsWith("+") || /^\d{10,}$/.test(identifier)) {
      phone = identifier;
    } else {
      id_number = identifier;
    }

    // Check if user exists
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? OR phone = ? OR id_number = ?",
      [email || null, phone || null, id_number || null]
    );

    if (existingUser.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Fetch Client role
    const [rows] = await db.query("SELECT id FROM roles WHERE name = 'Client'");
    const clientRole = rows[0];

    // Insert user with role_id
    const [insertResult] = await db.query(
      "INSERT INTO users (email, phone, id_number, password, is_active, role_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        email,
        phone,
        id_number,
        hashedPassword,
        true,
        clientRole ? clientRole.id : null,
      ]
    );

    return res.json({ success: true, message: "User registered successfully" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

//Unified Login - Checks both users and staff tables
router.post("/login", async (req, res) => {
  try {
    console.log("Login endpoint hit");
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    let user = null;
    let userType = null; // 'user' or 'staff'

    // Step 1: Check in users table first
    const [userRows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR phone = ? OR id_number = ?",
      [identifier, identifier, identifier]
    );

    if (userRows.length > 0) {
      user = userRows[0];
      userType = "user";
      console.log(
        "User found in users table:",
        user.email,
        "Role ID:",
        user.role_id
      );
    }

    // Step 2: If not found in users, check staff table
    if (!user) {
      const [staffRows] = await db.query(
        "SELECT * FROM staff WHERE email = ? OR phone = ? OR employee_id = ?",
        [identifier, identifier, identifier]
      );

      if (staffRows.length > 0) {
        user = staffRows[0];
        userType = "staff";
        console.log(
          "Staff found in staff table:",
          user.email,
          "Role ID:",
          user.role_id
        );
      }
    }

    // Step 3: If still not found, return error
    if (!user) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Step 4: Check if password exists (staff might not have password set yet)
    if (!user.password) {
      return res.status(403).json({
        success: false,
        error:
          "Account not activated. Please contact admin to set up your password.",
      });
    }

    // Step 5: Compare passwords
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }

    // Step 6: Check if account is active
    if (!user.is_active) {
      return res
        .status(403)
        .json({ success: false, error: "Account is not activated" });
    }

    const [roleRows] = await db.query(
      "SELECT name FROM roles WHERE id = ? LIMIT 1",
      [user.role_id]
    );

    const role_name = roleRows.length ? roleRows[0].name.toLowerCase() : null;

    // Step 7: Determine redirect URL based on role_id
    let redirectUrl;
    switch (user.role_id) {
      case 1:
        redirectUrl = "/admin/dashboard";
        break;
      case 2:
        redirectUrl = "/supervisor/dashboard";
        break;
      case 3:
        redirectUrl = "/staff/dashboard";
        break;
      case 4:
        redirectUrl = "/client/dashboard";
        break;
      case 5:
        redirectUrl = "/customer-care/dashboard";
        break;
      default:
        console.error("Unknown role_id:", user.role_id);
        return res.status(403).json({
          success: false,
          error: `Account role (${user.role_id}) is not configured. Please contact support.`,
        });
    }

    console.log("Redirect URL determined:", redirectUrl);

    // Step 8: Create session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({
          success: false,
          error: "Session error during login",
        });
      }

      // Store user data
      req.session.user = {
        id: user.id,
        email: user.email,
        role_id: user.role_id,
        role_name: role_name,
        phone: user.phone,
        id_number: user.id_number,
        employee_id: user.employee_id,
        userType: userType,
        first_name: user.first_name,
        second_name: user.second_name,
      };

      // Force session save before responding
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({
            success: false,
            error: "Session error",
          });
        }

        console.log("Session saved successfully:", req.session.user);
        console.log("Session ID:", req.sessionID);
        console.log("User Type:", userType);

        return res.json({
          success: true,
          message: "Login successful",
          redirectUrl,
          user: {
            email: user.email,
            role_id: user.role_id,
            userType: userType,
            name: `${user.first_name || ""} ${user.second_name || ""}`.trim(),
          },
        });
      });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true, message: "Logged out successfully" });
    });
  } else {
    return res.json({ success: true, message: "No active session" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      return res.json({ success: true, message: "Logged out successfully" });
    });
  } else {
    return res.json({ success: true, message: "No active session" });
  }
});

module.exports = router;
