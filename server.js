require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const session = require("express-session");
const fs = require("fs");
const ejs = require("ejs");
const apiSessionAuth = require("./src/middleware/apiSessionAuth");
const app = express();
const runMigrations = require("./src/migrations/index");
const authRoutes = require("./src/routes/authRoutes");
const admin = require("./src/routes/admin");
const staff = require("./src/routes/staff");
const client = require("./src/routes/client");
const bookings = require("./src/routes/bookings");
const payment = require("./src/routes/payment");
const staffAssignment = require("./src/routes/staff");
const schedules = require("./src/routes/schedules");
const SupportTickets = require("./src/routes/supportTickets");
const attendance = require("./src/routes/attendance");
const packages = require("./src/routes/packages");
const users = require("./src/routes/users");
const subscription = require("./src/routes/subscription");
const invoices = require("./src/routes/invoices");
const receipts = require("./src/routes/receipts");
const sales = require("./src/routes/sales");
const expenses = require("./src/routes/expenses");
const payslips = require("./src/routes/payslips");
const profile = require("./src/routes/profile");
const userProfile = require("./src/routes/userProfile");
const teamChat = require("./src/routes/teamChat");
const announcement = require("./src/routes/announcements");
const notificationsRoutes = require("./src/routes/notifications");
const reports = require("./src/routes/reports");
const { error } = require("console");
// Session Configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "drnet-session-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // false for development (http), set to true for production (https)
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
    name: "drnet.sid",
  })
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// VIEW ENGINE SETUP
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "frontend/admin"),
  path.join(__dirname, "frontend/supervisor"),
  path.join(__dirname, "frontend/staff"),
  path.join(__dirname, "frontend/client"),
  path.join(__dirname, "frontend/customer-care"),
]);

// STATIC ASSETS
app.use("/static", express.static(path.join(__dirname, "frontend/assets")));
app.use(
  "/admin/static",
  express.static(path.join(__dirname, "frontend/assets"))
);

// Backward compatibility paths
app.use(
  "/admin/js",
  express.static(path.join(__dirname, "frontend/assets/js"))
);
app.use(
  "/admin/css",
  express.static(path.join(__dirname, "frontend/assets/css"))
);
app.use(
  "/admin/images",
  express.static(path.join(__dirname, "frontend/assets/images"))
);
app.use(
  "/admin/videos",
  express.static(path.join(__dirname, "frontend/assets/videos"))
);

// AUTHENTICATION MIDDLEWARE

function requireAdminAuth(req, res, next) {
  console.log("Admin Auth Check:", req.session?.user);

  if (req.session?.user?.role_name === "admin") {
    return next();
  }

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      redirectUrl: "/login",
    });
  }

  return res.redirect("/login");
}

function requireSupervisorAuth(req, res, next) {
  console.log("Supervisor Auth Check:", req.session?.user);

  if (req.session?.user?.role_name === "supervisor") {
    console.log("Supervisor auth passed");
    return next();
  }

  console.log("Supervisor auth failed");

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      redirectUrl: "/login",
    });
  }

  return res.redirect("/login");
}

function requireCustomerCareAuth(req, res, next){
  console.log("Customer Care Auth check:", req.session?.user);

  if (req.session?.user?.role_name === "customer-care") {
    console.log("Customer care auth passed");
    return next();
  }

  console.log("Customer care auth failed");

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      redirectUrl: "/login",
    });
  }

  return res.redirect("/login");
}

function requireStaffAuth(req, res, next) {
  console.log("Staff Auth Check:", req.session?.user);
  if (req.session?.user?.role_name === "staff") {
    console.log("Staff auth passed");
    return next();
  }

  console.log("Staff auth failed");

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      redirectUrl: "/login",
    });
  }

  return res.redirect("/login");
}

function requireClientAuth(req, res, next) {
  console.log("Client Auth Check:", req.session?.user);
  if (req.session?.user?.role_name === "client") {
    console.log("Client auth passed");
    return next();
  }

  console.log("CLient auth failed");

  if (req.path.startsWith("/api/")) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      redirectUrl: "/login",
    });
  }

  return res.redirect("/login");
}

// API ROUTES
app.use("/api", authRoutes);
app.use("/api", apiSessionAuth, admin);
app.use("/api", apiSessionAuth, attendance);
app.use("/api", apiSessionAuth, packages);
app.use("/api", apiSessionAuth, users);
app.use("/api", apiSessionAuth, staff);
app.use("/api", apiSessionAuth, client);
app.use("/api", apiSessionAuth, payment);
app.use("/api", apiSessionAuth, staffAssignment);
app.use("/api", apiSessionAuth, schedules);
app.use("/api", apiSessionAuth, SupportTickets);
app.use("/api", apiSessionAuth, subscription);
app.use("/api", apiSessionAuth, invoices);
app.use("/api", apiSessionAuth, receipts);
app.use("/api", apiSessionAuth, sales);
app.use("/api", apiSessionAuth, expenses);
app.use("/api", apiSessionAuth, payslips);
app.use("/api", apiSessionAuth, profile);
app.use("/api", apiSessionAuth, userProfile);
app.use("/api/client", bookings);
app.use("/api", apiSessionAuth, teamChat);
app.use("/api", apiSessionAuth, announcement);
app.use("/api", apiSessionAuth, notificationsRoutes);
app.use("/api", apiSessionAuth, reports);

// Create uploads folder
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// FRONTEND PUBLIC ROUTES

app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend/index.html"))
);

app.get("/login", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend/login.html"))
);

app.get("/register", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend/register.html"))
);

app.get("/forgot_password", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend/forgot_password.html"))
);

// ADMIN ROUTES

const adminPages = [
  "dashboard",
  "staff-attendance",
  "my-packages",
  "manage-users",
  "service-management",
  "support-tickets",
  "finance",
  "reports",
  "profile",
  "register-user",
  "renewals",
  "website-bookings",
  "invoice-generator",
  "service-assignments",
  "equipment-inventory",
  "admin-assistant-dashboard",
  "supervisor-dashboard",
  "deleted-users",
  "attendance",
  "communication-team",
  "equipments",
  "expired-users",
  "active-users",
  "notifications",
  "reminders"
];

app.get("/admin/:page", requireAdminAuth, (req, res) => {
  let page = req.params.page;
  if (!adminPages.includes(page)) {
    return res.redirect("/admin/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("admin_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
  });
});

app.get("/admin", requireAdminAuth, (req, res) => {
  res.redirect("/admin/dashboard");
});

//Supervisor Routes
const supervisorPages = [
  "dashboard",
  "staff-attendance",
  "my-packages",
  "manage-users",
  "service-management",
  "support-tickets",
  "finance",
  "reports",
  "profile",
  "register-user",
  "renewals",
  "website-bookings",
  "invoice-generator",
  "service-assignments",
  "equipment-inventory",
  "admin-assistant-dashboard",
  "supervisor-dashboard",
  "deleted-users",
  "attendance",
  "communication-team",
  "equipments",
  "my-customers",
  "work-schedule",
  "notifications",
  "daily_reports",
];

app.get("/supervisor/:page", requireSupervisorAuth, (req, res) => {
  let page = req.params.page;
  if (!supervisorPages.includes(page)) {
    return res.redirect("/supervisor/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("supervisor_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
  });
});

app.get("/supervisor", requireSupervisorAuth, (req, res) => {
  res.redirect("/supervisor/dashboard");
});

//Customer care Routes
const customerCarePages = [
  "dashboard",
  "manage-users",
  "support-tickets",
  "reports",
  "profile",
  "communication-team",
  "my-customers",
  "work-schedule",
  "notifications",
  "daily_reports",
  "active-users",
  "expired-users"
];

app.get("/customer-care/:page", requireCustomerCareAuth, (req, res) => {
  let page = req.params.page;
  if (!customerCarePages.includes(page)) {
    return res.redirect("/customer-care/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("customer_care_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
  });
});

app.get("/customer-care", requireCustomerCareAuth, (req, res) => {
  res.redirect("/customer-care/dashboard");
});

// STAFF ROUTES

const staffPages = [
  "dashboard",
  "profile",
  "communication-team",
  "my-customers",
  "support-tickets",
  "work-schedule",
  "notifications",
];

app.get("/staff/:page", requireStaffAuth, (req, res) => {
  let page = req.params.page;
  if (!staffPages.includes(page)) {
    return res.redirect("/staff/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("staff_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
  });
});

app.get("/staff", requireStaffAuth, (req, res) => {
  res.redirect("/staff/dashboard");
});

// CLIENT ROUTES

const clientPages = [
  "dashboard",
  "profile",
  "my-subscription",
  "support",
  "payment-billing",
  "notifications",
];

app.get("/client/:page", requireClientAuth, (req, res) => {
  let page = req.params.page;
  if (!clientPages.includes(page)) {
    return res.redirect("/client/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("client_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
  });
});

app.get("/client", requireClientAuth, (req, res) => {
  res.redirect("/client/dashboard");
});

// ERROR HANDLING

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

// SERVER STARTUP

async function startServer() {
  try {
    console.log("Starting Dr.Net Server...");
    await runMigrations();
    console.log("Migrations complete.");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    process.on("SIGINT", () => {
      console.log("\nShutting down...");
      server.close(() => {
        console.log("Server closed");
        process.exit(0);
      });
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
