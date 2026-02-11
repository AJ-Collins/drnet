const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const db = require("../config/db");

// Constants - More lenient rate limiting
const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 20; // More attempts allowed
const LOCKOUT_DURATION = 3 * 60 * 1000; // Only 3 minutes lockout
const ATTEMPT_WINDOW = 30 * 60 * 1000; // Track attempts over 30 minutes
const IP_MAX_ATTEMPTS = 50; // Per IP limit (prevents DDoS)
const IP_LOCKOUT_DURATION = 10 * 60 * 1000; // 10 minutes for IP ban

const validators = {
  email: (str) => {
    if (!str || typeof str !== 'string') return false;
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(str.trim());
  },
  phone: (str) => /^(\+)?[\d\s\-()]{10,}$/.test(str),
  password: (str) => str && str.length >= 8,
};

const sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  return input.trim().substring(0, 255);
};

const loginAttempts = new Map(); // Per user/identifier
const ipAttempts = new Map(); // Per IP address

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0]; // First IP is the original client
  }
  
  return req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'unknown';
};

const checkUserRateLimit = (identifier) => {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, lastAttempt: now };

  if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
    loginAttempts.delete(identifier);
    return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
  }

  // Check if currently locked out
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    // If lockout period has passed, reset
    if (timeSinceLastAttempt > LOCKOUT_DURATION) {
      loginAttempts.delete(identifier);
      return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS };
    }
    
    const timeLeft = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
    return { allowed: false, timeLeft, attempts: attempts.count, reason: 'user' };
  }

  return { allowed: true, remaining: MAX_LOGIN_ATTEMPTS - attempts.count };
};

const checkIPRateLimit = (ip) => {
  const now = Date.now();
  const attempts = ipAttempts.get(ip) || { count: 0, firstAttempt: now, lastAttempt: now };

  // Reset if outside the attempt window
  if (now - attempts.firstAttempt > ATTEMPT_WINDOW) {
    ipAttempts.delete(ip);
    return { allowed: true, remaining: IP_MAX_ATTEMPTS };
  }

  if (attempts.count >= IP_MAX_ATTEMPTS) {
    const timeSinceLastAttempt = now - attempts.lastAttempt;
    
    if (timeSinceLastAttempt > IP_LOCKOUT_DURATION) {
      ipAttempts.delete(ip);
      return { allowed: true, remaining: IP_MAX_ATTEMPTS };
    }
    
    const timeLeft = Math.ceil((IP_LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
    return { allowed: false, timeLeft, attempts: attempts.count, reason: 'ip' };
  }

  return { allowed: true, remaining: IP_MAX_ATTEMPTS - attempts.count };
};

// Record login attempt for user
const recordUserAttempt = (identifier, success) => {
  if (success) {
    loginAttempts.delete(identifier);
    return;
  }

  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now, lastAttempt: now };
  
  loginAttempts.set(identifier, {
    count: attempts.count + 1,
    firstAttempt: attempts.firstAttempt,
    lastAttempt: now,
  });
};

const recordIPAttempt = (ip, success) => {
  if (success) {
    return;
  }

  const now = Date.now();
  const attempts = ipAttempts.get(ip) || { count: 0, firstAttempt: now, lastAttempt: now };
  
  ipAttempts.set(ip, {
    count: attempts.count + 1,
    firstAttempt: attempts.firstAttempt,
    lastAttempt: now,
  });
};

setInterval(() => {
  const now = Date.now();
  
  // Clean user attempts
  for (const [key, value] of loginAttempts.entries()) {
    if (now - value.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
  
  // Clean IP attempts
  for (const [key, value] of ipAttempts.entries()) {
    if (now - value.lastAttempt > ATTEMPT_WINDOW) {
      ipAttempts.delete(key);
    }
  }
}, 60000); // Clean up every minute


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
    const cleanPassword = password.trim();

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
      const [existingUser] = await connection.query(
        "SELECT id FROM users WHERE LOWER(TRIM(email)) = ? OR phone = ? OR id_number = ? LIMIT 1",
        [email ? email.toLowerCase() : null, phone, id_number]
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

      // Insert user - using parameterized query (SQL injection safe)
      const [insertResult] = await connection.query(
        `INSERT INTO users (email, phone, id_number, password, is_active, role_id, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [email, phone, id_number, hashedPassword, true, clientRoleId]
      );

      if (!insertResult.insertId) {
        throw new Error("Failed to create user");
      }

      await connection.commit();


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

    const clientIP = getClientIP(req);
    console.log(`🌐 Login attempt from IP: ${clientIP}`);

    const cleanIdentifier = sanitizeInput(identifier);
    const normalizedIdentifier = cleanIdentifier.toLowerCase();
    const cleanPassword = password.trim();

    const ipRateCheck = checkIPRateLimit(clientIP);
    if (!ipRateCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: `Too many requests from your network. Please try again in ${ipRateCheck.timeLeft} minute${ipRateCheck.timeLeft > 1 ? 's' : ''}.` 
      });
    }

    // Check user-specific rate limiting (account protection)
    const userRateCheck = checkUserRateLimit(normalizedIdentifier);
    if (!userRateCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: `Too many login attempts for this account. Please try again in ${userRateCheck.timeLeft} minute${userRateCheck.timeLeft > 1 ? 's' : ''}.` 
      });
    }

    // Get connection
    connection = await db.getConnection();

    let user = null;
    let userType = null;


    // Check users table (clients) - SQL injection safe with parameterized queries
    const [userRows] = await connection.query(
      `SELECT * FROM users 
       WHERE LOWER(TRIM(email)) = ? 
       OR REPLACE(TRIM(phone), ' ', '') = ? 
       OR TRIM(id_number) = ? 
       LIMIT 1`,
      [normalizedIdentifier, normalizedIdentifier, normalizedIdentifier]
    );

    if (userRows.length > 0) {
      user = userRows[0];
      userType = "user";
    }

    if (!user) {
      const [staffRows] = await connection.query(
        `SELECT * FROM staff 
         WHERE LOWER(TRIM(email)) = ? 
         OR REPLACE(TRIM(phone), ' ', '') = ? 
         OR TRIM(employee_id) = ? 
         LIMIT 1`,
        [normalizedIdentifier, normalizedIdentifier, normalizedIdentifier]
      );

      if (staffRows.length > 0) {
        user = staffRows[0];
        userType = "staff";
      }
    }

    // User not found
    if (!user) {
      recordUserAttempt(normalizedIdentifier, false);
      recordIPAttempt(clientIP, false);
      
      // Generic error message to prevent user enumeration
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

    const passwordMatch = await bcrypt.compare(cleanPassword, user.password);
    
    if (!passwordMatch) {
      recordUserAttempt(normalizedIdentifier, false);
      recordIPAttempt(clientIP, false);
      
      // Generic error message to prevent user enumeration
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

    let role_name = null;
    let redirectUrl = null;

    if (userType === "user") {
      role_name = "client";
      redirectUrl = "/client/dashboard";
    } 

    else if (userType === "staff") {
      const [roleRows] = await connection.query(
        "SELECT name FROM roles WHERE id = ? LIMIT 1",
        [user.role_id]
      );

      if (roleRows.length === 0) {
        return res.status(500).json({
          success: false,
          error: "Account configuration error. Please contact support.",
        });
      }

      role_name = roleRows[0].name.toLowerCase();

      // Determine redirect URL for staff based on role
      const roleRoutes = {
        1: "/admin/dashboard",
        2: "/supervisor/dashboard",
        3: "/staff/dashboard",
        5: "/customer-care/dashboard",
        6: "/hr-assistant/dashboard",
      };

      redirectUrl = roleRoutes[user.role_id];

      if (!redirectUrl) {
        return res.status(403).json({
          success: false,
          error: `Account role is not configured. Please contact support.`,
        });
      }
    }

    // Create session
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Unable to create session. Please try again.",
        });
      }

      // Store user data in session
      req.session.user = {
        id: user.id,
        email: user.email || null,
        role_id: user.role_id || null,
        role_name: role_name,
        phone: user.phone || null,
        id_number: user.id_number || null,
        employee_id: user.employee_id || null,
        department: user.department || null,
        userType: userType,
        first_name: user.first_name || "",
        second_name: user.second_name || "",
        loginTime: new Date().toISOString(),
        loginIP: clientIP, // Track login IP
      };

      // Save session
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("❌ Session save error:", saveErr);
          return res.status(500).json({
            success: false,
            error: "Session error. Please try again.",
          });
        }

        recordUserAttempt(normalizedIdentifier, true);
        recordIPAttempt(clientIP, true);

        console.log(`LOGIN SUCCESS: ${user.email || user.phone} (${role_name}) from IP: ${clientIP}`);

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

// Session check endpoint
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