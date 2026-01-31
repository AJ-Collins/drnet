const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

// Constants
const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Validation helpers
const validators = {
  email: (str) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str),
  phone: (str) => /^(\+)?[\d\s\-()]{10,}$/.test(str),
  password: (str) => str && str.length >= 8,
};

// Sanitize input
const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().substring(0, 255); // Prevent excessively long inputs
};

// Rate limiting helper (basic implementation)
const loginAttempts = new Map();

const checkRateLimit = (identifier) => {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now };

  if (now - attempts.firstAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(identifier);
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeLeft = Math.ceil((LOCKOUT_DURATION - (now - attempts.firstAttempt)) / 60000);
    return { allowed: false, timeLeft };
  }

  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - attempts.count };
};

const recordLoginAttempt = (identifier, success) => {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now };
  
  loginAttempts.set(identifier, {
    count: attempts.count + 1,
    firstAttempt: attempts.firstAttempt,
  });
};

console.log("Enhanced authRoutes loaded");

// Client Registration
router.post("/register", async (req, res) => {
  let connection;
  
  try {
    const { identifier, password } = req.body;

    // Input validation
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required" 
      });
    }

    // Sanitize inputs
    const cleanIdentifier = sanitizeInput(identifier);
    const cleanPassword = sanitizeInput(password);

    // Password strength validation
    if (!validators.password(cleanPassword)) {
      return res.status(400).json({ 
        success: false, 
        error: "Password must be at least 8 characters long" 
      });
    }

    // Determine identifier type
    let email = null, phone = null, id_number = null;

    if (validators.email(cleanIdentifier)) {
      email = cleanIdentifier.toLowerCase();
    } else if (validators.phone(cleanIdentifier)) {
      phone = cleanIdentifier.replace(/\s/g, "");
    } else if (cleanIdentifier.length > 0) {
      id_number = cleanIdentifier;
    } else {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid identifier format" 
      });
    }

    // Get connection from pool
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Check if user exists
      const [existingUser] = await connection.query(
        "SELECT id FROM users WHERE email = ? OR phone = ? OR id_number = ? LIMIT 1",
        [email, phone, id_number]
      );

      if (existingUser.length > 0) {
        await connection.rollback();
        return res.status(400).json({ 
          success: false, 
          error: "User already exists" 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(cleanPassword, SALT_ROUNDS);

      // Fetch Client role
      const [roleRows] = await connection.query(
        "SELECT id FROM roles WHERE name = 'Client' LIMIT 1"
      );

      if (roleRows.length === 0) {
        await connection.rollback();
        console.error("Client role not found in database");
        return res.status(500).json({ 
          success: false, 
          error: "System configuration error. Please contact support." 
        });
      }

      const clientRoleId = roleRows[0].id;

      // Insert user
      const [insertResult] = await connection.query(
        `INSERT INTO users (email, phone, id_number, password, is_active, role_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [email, phone, id_number, hashedPassword, true, clientRoleId]
      );

      if (!insertResult.insertId) {
        throw new Error("Failed to create user");
      }

      await connection.commit();

      console.log(`✅ New user registered: ${email || phone || id_number}`);

      return res.status(201).json({ 
        success: true, 
        message: "User registered successfully" 
      });

    } catch (innerErr) {
      await connection.rollback();
      throw innerErr;
    }

  } catch (err) {
    console.error("Registration error:", err);
    
    // Handle specific errors
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ 
        success: false, 
        error: "User already exists" 
      });
    }

    return res.status(500).json({ 
      success: false, 
      error: "Unable to register user. Please try again later." 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Unified Login
router.post("/login", async (req, res) => {
  let connection;
  
  try {
    const { identifier, password } = req.body;

    // Input validation
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false, 
        error: "All fields are required" 
      });
    }

    // Sanitize inputs
    const cleanIdentifier = sanitizeInput(identifier);
    const cleanPassword = sanitizeInput(password);

    // Check rate limiting
    const rateCheck = checkRateLimit(cleanIdentifier);
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: `Too many login attempts. Please try again in ${rateCheck.timeLeft} minutes.` 
      });
    }

    // Get connection
    connection = await db.getConnection();

    let user = null;
    let userType = null;

    // Check users table
    const [userRows] = await connection.query(
      "SELECT * FROM users WHERE email = ? OR phone = ? OR id_number = ? LIMIT 1",
      [cleanIdentifier, cleanIdentifier, cleanIdentifier]
    );

    if (userRows.length > 0) {
      user = userRows[0];
      userType = "user";
    }

    // Check staff table if not found
    if (!user) {
      const [staffRows] = await connection.query(
        "SELECT * FROM staff WHERE email = ? OR phone = ? OR employee_id = ? LIMIT 1",
        [cleanIdentifier, cleanIdentifier, cleanIdentifier]
      );

      if (staffRows.length > 0) {
        user = staffRows[0];
        userType = "staff";
      }
    }

    // User not found
    if (!user) {
      recordLoginAttempt(cleanIdentifier, false);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Check if password is set
    if (!user.password) {
      return res.status(403).json({
        success: false,
        error: "Account not activated. Please contact admin to set up your password.",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(cleanPassword, user.password);
    
    if (!passwordMatch) {
      recordLoginAttempt(cleanIdentifier, false);
      return res.status(401).json({ 
        success: false, 
        error: "Invalid credentials" 
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: "Account is not activated. Please contact support." 
      });
    }

    // Get role information
    const [roleRows] = await connection.query(
      "SELECT name FROM roles WHERE id = ? LIMIT 1",
      [user.role_id]
    );

    const role_name = roleRows.length > 0 ? roleRows[0].name.toLowerCase() : null;

    if (!role_name) {
      console.error("Role not found for user:", user.id);
      return res.status(500).json({
        success: false,
        error: "Account configuration error. Please contact support.",
      });
    }

    // Determine redirect URL
    const roleRoutes = {
      1: "/admin/dashboard",
      2: "/supervisor/dashboard",
      3: "/staff/dashboard",
      4: "/client/dashboard",
      5: "/customer-care/dashboard",
      6: "/hr-assistant/dashboard",
    };

    const redirectUrl = roleRoutes[user.role_id];

    if (!redirectUrl) {
      console.error("Unknown role_id:", user.role_id);
      return res.status(403).json({
        success: false,
        error: `Account role is not configured. Please contact support.`,
      });
    }

    // Create session
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.status(500).json({
          success: false,
          error: "Unable to create session. Please try again.",
        });
      }

      // Store user data in session
      req.session.user = {
        id: user.id,
        email: user.email || null,
        role_id: user.role_id,
        role_name: role_name,
        phone: user.phone || null,
        id_number: user.id_number || null,
        employee_id: user.employee_id || null,
        userType: userType,
        first_name: user.first_name || "",
        second_name: user.second_name || "",
        loginTime: new Date().toISOString(),
      };

      // Save session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Session save error:", saveErr);
          return res.status(500).json({
            success: false,
            error: "Session error. Please try again.",
          });
        }

        // Record successful login
        recordLoginAttempt(cleanIdentifier, true);

        console.log(`User logged in: ${user.email || user.phone} (${role_name})`);

        return res.json({
          success: true,
          message: "Login successful",
          redirectUrl,
          user: {
            email: user.email,
            role_id: user.role_id,
            role_name: role_name,
            userType: userType,
            name: `${user.first_name || ""} ${user.second_name || ""}`.trim() || "User",
          },
        });
      });
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Unable to process login. Please try again later." 
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Logout route
router.post("/logout", (req, res) => {
  try {
    if (!req.session) {
      return res.json({ 
        success: true, 
        message: "No active session" 
      });
    }

    const userEmail = req.session.user?.email || "Unknown";

    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ 
          success: false, 
          error: "Unable to logout. Please try again." 
        });
      }

      res.clearCookie("connect.sid", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      console.log(`✅ User logged out: ${userEmail}`);

      return res.json({ 
        success: true, 
        message: "Logged out successfully" 
      });
    });
  } catch (err) {
    console.error("Logout exception:", err);
    return res.status(500).json({ 
      success: false, 
      error: "Logout failed" 
    });
  }
});

// Session check endpoint (optional but useful)
router.get("/check-session", (req, res) => {
  try {
    if (req.session && req.session.user) {
      return res.json({
        success: true,
        authenticated: true,
        user: {
          email: req.session.user.email,
          role_name: req.session.user.role_name,
          name: `${req.session.user.first_name} ${req.session.user.second_name}`.trim(),
        },
      });
    }

    return res.json({
      success: true,
      authenticated: false,
    });
  } catch (err) {
    console.error("Session check error:", err);
    return res.status(500).json({
      success: false,
      error: "Unable to check session",
    });
  }
});

module.exports = router;