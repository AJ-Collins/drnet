require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const compression = require("compression");
const { createSessionMiddleware } = require("./src/config/sessionStore");
const app = express();
const authRoutes = require("./src/routes/authRoutes");
const admin = require("./src/routes/admin");
const inventory = require("./src/routes/inventory");

const supervisor = require("./src/routes/supervisor");
const client = require("./src/routes/client");
const sitebookings = require("./src/routes/sitebookings");
const bookings = require("./src/routes/bookings");
const payment = require("./src/routes/payment");
const staffAssignment = require("./src/routes/supervisor");
const schedules = require("./src/routes/schedules");

// Support tickets
const SupportTickets = require("./src/routes/supportTickets");

// Assignment tasks
const taskAssignments = require("./src/routes/assignments");

// Care dahsboard
const careDashboard = require("./src/routes/careDashboard");

// Onboard clients
const onboardClients = require("./src/routes/clientOnboard");

// Staff dahsboard stats
const staffDashboard = require("./src/routes/staffDashboard");


const attendance = require("./src/routes/attendance");
const packages = require("./src/routes/packages");
const sitePackages = require("./src/routes/sitePackages");
const users = require("./src/routes/users");
const subscription = require("./src/routes/subscription");
const invoices = require("./src/routes/invoices");
const receipts = require("./src/routes/receipts");
const sales = require("./src/routes/salesRoutes");
const expenses = require("./src/routes/expenses");
const payslips = require("./src/routes/payslips");
const profile = require("./src/routes/profile");
const userProfile = require("./src/routes/userProfile");
const communicationRoutes = require("./src/routes/communicationRoutes");
const notificationsRoutes = require("./src/routes/notifications");
const reports = require("./src/routes//reportRoutes");
// Admin dashboard
const admindashboard = require("./src/routes/dashboard");
//Subscriptions
const subscriptionRoutes = require("./src/routes/subscriptionRoutes");

// Assignments
const staffAssignments = require("./src/routes/staffAssignments");

//Hr assistant
const hrexpenses = require("./src/routes/hrexpenses");
const hrtasks = require("./src/routes/hrtasks");
const hrbookings = require("./src/routes/hrbookings");
const hrplanner = require("./src/routes/hrplanner");
const hrcommslogs = require("./src/routes/hrcommslogs");
const hrnotify = require("./src/routes/hrnotify");
const hrdashboard = require("./src/routes/hrdashboard");
const hrinbox = require("./src/routes/hrinbox");
const hrinboxreply = require("./src/routes/hrinboxreply");
const smslogs = require("./src/routes/smslogsRoutes");
//Client
const clientRoutes = require('./src/routes/clientRoutes');
//Staff
const staffRoutes = require('./src/routes/staffRoutes');
const staffSalary = require('./src/routes/staffSalary');

// Session Configuration — MySQL-backed store (replaces default MemoryStore)
app.use(createSessionMiddleware());

// Middleware
app.use(cors());

// Compression
app.use(compression());

// Security headers with Helmet
// Disabling contentSecurityPolicy temporarily as it might break existing frontend assets
// if they load inline scripts or external resources not explicitly allowed.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// Request body size limits — prevents large payload attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global API rate limiting — 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please try again later.",
  },
});

// Stricter rate limit for auth endpoints — 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication attempts, please try again later.",
  },
});

// Apply rate limiters
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/forgot", authLimiter);
app.use("/api", apiLimiter);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// VIEW ENGINE SETUP
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "frontend/admin"),
  path.join(__dirname, "frontend/supervisor"),
  path.join(__dirname, "frontend/staff"),
  path.join(__dirname, "frontend/client"),
  path.join(__dirname, "frontend/customer-care"),
  path.join(__dirname, "frontend/hr-assistant"),
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

function requireCustomerCareAuth(req, res, next) {
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

function requireHrAssistantAuth(req, res, next) {
  console.log("HR Assistant Auth Check:", req.session?.user);
  if (req.session?.user?.role_name === "hr-assistant") {
    console.log("Hr Assistant Auth passed");
    return next();
  }

  console.log("Hr Assistant Auth failed");

  if (req.path.startsWith("/api")) {
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
app.use("/api/site", sitePackages);
app.use("/api/client/web", sitebookings);
app.use("/api", bookings);
app.use("/api", admin);

// Inventory
app.use("/api", inventory);

app.use("/api", attendance);
app.use("/api", packages);
app.use("/api", users);
app.use("/api/sup", supervisor);
app.use("/api", client);
app.use("/api", payment);
app.use("/api", staffAssignment);
app.use("/api", schedules);
app.use("/api", SupportTickets);
app.use("/api", subscription);
app.use("/api", invoices);
app.use("/api", receipts);
app.use("/api", sales);
app.use("/api", expenses);
app.use("/api", payslips);
app.use("/api", profile);
app.use("/api", userProfile);
app.use("/api/communication", communicationRoutes);
app.use("/api", notificationsRoutes);
app.use("/api/reports", reports);
// Admin dahsboard
app.use("/api/dashboard", admindashboard);
//Client
app.use('/api/manage/clients', clientRoutes);
//Staff
app.use('/api/manage/staff', staffRoutes);
app.use('/api/finance', staffSalary);
//Subsriptions
app.use("/api/subscriptions", subscriptionRoutes);

// Task Assignments
app.use("/api", taskAssignments);

// Assignments
app.use("/api", staffAssignments);

// Care dashboard
app.use('/api/care', careDashboard);

// Onboard clients
app.use("/api/onboard", onboardClients);

// Staff dashboard stats
app.use("/api/staff", staffDashboard);

//Hr
app.use("/api/hr", hrexpenses);
app.use("/api/hr", hrtasks);
app.use("/api/hr", hrbookings);
app.use("/api/hr", hrplanner);
app.use("/api/hr", hrcommslogs);
app.use("/api/hr", hrnotify);
app.use("/api/hr", hrdashboard);
app.use("/api/hr", hrinbox);
app.use("/api/hr", hrinboxreply);
app.use("/api/hr", smslogs);


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
  "subscriptions",
  "my-packages",
  "manage-users",
  "service-management",
  "support-tickets",
  "finance",
  "reports",
  "profile",
  "register-user",
  "website-bookings",
  "invoice-generator",
  "service-assignments",
  "inventory",
  "deleted-users",
  "attendance",
  "communication-team",
  "equipments",
  "expired-users",
  "active-users",
  "notifications",
  "reminders",
  "operational-inbox",
  "sales",
  "onboard-commission"
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
  "task-assignment",
  "staff-attendance",
  "service-management",
  "manage-users",
  "profile",
  "website-bookings",
  "inventory",
  "communication-team",
  "notifications",
  "daily_reports",
  "onboard"
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
  "support-tickets",
  "profile",
  "communication-team",
  "notifications",
  "task-assignment",
  "subscriptions",
  "onboard",
  "report"
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

//HR Assistant Routes
const hrAssistantPages = [
  "dashboard",
  "expenses",
  "tasks",
  "bookings",
  "communication",
  "planner",
  "reminders",
  "profile",
  "communication-team",
  "onboard",
  "report"
];

app.get("/hr-assistant/:page", requireHrAssistantAuth, (req, res) => {
  let page = req.params.page;
  if (!hrAssistantPages.includes(page)) {
    return res.redirect("/hr-assistant/dashboard");
  }

  const title = page
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  res.render("hr_assistant_layout", {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page,
    user: req.session.user
  });
});

app.get('/hr-assistant/projects/:id', requireHrAssistantAuth, (req, res) => {
  res.render("hr_assistant_layout", {
    pageTitle: "Project Details",
    pageSubtitle: `View and manage project #${req.params.id}`,
    currentPage: "project-detail",
    projectId: req.params.id,
    user: req.session.user
  });
});
app.get("/hr-assistant", requireHrAssistantAuth, (req, res) => {
  res.redirect("/hr-assistant/dashboard");
});

// STAFF ROUTES

const staffPages = [
  "dashboard",
  "profile",
  "task-assignment",
  "earnings",
  "onboard",
  "report",
  "communication-team",
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

// GLOBAL EXPRESS ERROR HANDLER
// Prevents standard HTML error pages that can leak stack traces
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  if (req.path.startsWith("/api/")) {
    return res.status(err.status || 500).json({
      success: false,
      error: process.env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
    });
  }
  res.status(err.status || 500).send("Internal Server Error");
});

// ERROR HANDLING — log but don't crash on every unhandled rejection

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  // Exit on truly fatal errors — the hosting env will restart the process
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  // Log but do NOT exit — crashing on every unhandled rejection kills the
  // entire server for a single failed DB query or API call
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// SERVER STARTUP
async function startServer() {
  try {
    console.log("Starting Dr.Net Server...");



    const PORT = process.env.PORT || 5000;

    const httpServer = http.createServer(app);

    // Request timeouts — prevents hung connections from holding resources
    httpServer.requestTimeout = 30_000;    // 30 seconds max for entire request
    httpServer.headersTimeout = 35_000;    // 35 seconds to receive headers
    httpServer.keepAliveTimeout = 5_000;   // 5 seconds idle before closing

    const io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    app.set('socketio', io);

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("joinTicket", (ticketId) => {
        socket.rooms.forEach(room => {
          if (room !== socket.id) socket.leave(room);
        });

        socket.join(`ticket_${ticketId}`);
        console.log(`User ${socket.id} joined ticket room: ticket_${ticketId}`);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Heap limit: ${process.env.npm_config_max_old_space_size || "default"} MB`);
    });

    // Memory monitoring — log every 60 seconds
    setInterval(() => {
      const mem = process.memoryUsage();
      const rssMB = Math.round(mem.rss / 1024 / 1024);
      const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
      const externalMB = Math.round(mem.external / 1024 / 1024);

      console.log(
        `[Memory] RSS: ${rssMB} MB | Heap: ${heapUsedMB}/${heapTotalMB} MB | External: ${externalMB} MB`
      );

      // Warn if memory is getting high
      if (rssMB > 400) {
        console.warn(
          `[Memory WARNING] RSS is ${rssMB} MB — approaching heap limit. Investigate for leaks.`
        );
      }
    }, 60_000);

    // Graceful shutdown on SIGINT and SIGTERM
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        console.log("Server closed");
        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}


startServer();