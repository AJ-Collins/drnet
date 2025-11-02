const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

// Add error handling to catch issues
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Rejection:', err);
  process.exit(1);
});
const runMigrations = require('./migrations-sqlite');
const createDefaultAdmin = require('./createAdmin');
const seedInitialData = require('./seedData');
const bookingRoutes = require('./Routes/bookingRoutes');
const contactRoutes = require('./Routes/contactRoutes');
const adminRoutes = require('./Routes/adminRoutes');
const userRoutes = require('./Routes/userRoutes');
const renewals = require('./Routes/renewals');
const clientRoutes = require('./Routes/clientRoutes');
const staffRoutes = require('./Routes/staffRoutes');

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET || 'drnet-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// ✅ Startup Debug Log
console.log("🛠️ Starting Dr.Net Server...");

// ✅ Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.urlencoded({ extended: true }));

// ✅ Static File Serving - Perfect for absolute paths like /admin/js/common.js
// Serve admin static files with proper MIME types
app.use('/admin/js', express.static(path.join(__dirname, 'frontend/js'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use('/admin/css', express.static(path.join(__dirname, 'frontend/css'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.use('/admin/images', express.static(path.join(__dirname, 'frontend/images')));
app.use('/admin/VIDEOS', express.static(path.join(__dirname, 'frontend/VIDEOS')));

// General static files (for root level requests)
app.use(express.static(path.join(__dirname, 'frontend')));

console.log("✅ Static file serving configured");
console.log("✅ Middleware initialized");

// ✅ API Routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);

// Protect admin routes
function requireAdminAuth(req, res, next) {
    if (req.session && req.session.admin) {
        return next();
    }
    res.redirect('/admin/login');
}

function requireClientAuth(req, res, next) {
    if (req.session && req.session.client) {
        return next();
    }
    res.redirect('/client/login');
}

function requireStaffAuth(req, res, next) {
    if (req.session && req.session.staff) {
        return next();
    }
    res.redirect('/staff/login');
}

app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/renewals', renewals);
app.use('/api/client', clientRoutes);
app.use('/api/staff', staffRoutes);

console.log("✅ Routes loaded");

// ✅ Health Check Route
app.get('/api/test', (req, res) => {
    res.send('✅ Server and middleware working');
});

// ✅ Session Test Route
app.get('/api/session-test', (req, res) => {
    res.json({
        sessionId: req.sessionID,
        session: req.session,
        staff: req.session.staff
    });
});

// ✅ Direct Dashboard Test Route (bypass middleware)
app.get('/test-dashboard', (req, res) => {
    console.log('🔍 Test dashboard requested');
    console.log('📍 Session staff:', req.session.staff);
    console.log('📍 Full session:', req.session);
    console.log('📍 Session ID:', req.sessionID);
    
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving test dashboard');
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-dashboard.html'));
    } else {
        console.log('❌ No supervisor session found');
        res.json({
            error: 'No supervisor session found',
            session: req.session,
            staff: req.session.staff
        });
    }
});

// ✅ HTML Routes
// Default first page - Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Legacy route for existing bookings page
app.get('/fine', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'fine.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'admin-login.html'));
});

app.get('/admin/dashboard', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

app.get('/admin/register', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'register-user.html'));
});

app.get('/admin/manage/users', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'manage-users.html'));
});

app.get('/admin/renewals', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'renewals.html'));
});

app.get('/admin/invoice', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'invoice-generator.html'));
});

app.get('/admin/bookings', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'website-bookings.html'));
});

app.get('/admin/settings', requireAdminAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'settings.html'));
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/admin/login');
    });
});

// Client Routes
app.get('/client/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'client-login.html'));
});

app.get('/client/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'client-registration.html'));
});

app.get('/client/dashboard', requireClientAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'client-dashboard.html'));
});

app.get('/client/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/client/login');
    });
});

// Staff Routes
app.get('/staff/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'staff-login.html'));
});

// Unified Login Portal
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'unified-login.html'));
});

app.get('/staff/dashboard', requireStaffAuth, (req, res) => {
    console.log('🔍 General staff dashboard requested');
    console.log('📍 Session staff:', req.session.staff);
    console.log('⚠️ This should only be accessed if no role-specific redirect occurred');
    res.sendFile(path.join(__dirname, 'frontend', 'staff-dashboard.html'));
});

app.get('/staff/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/staff/login');
    });
});

// Role-Specific Dashboard Routes
app.get('/admin-assistant/dashboard', requireStaffAuth, (req, res) => {
    console.log('🔍 Admin Assistant dashboard requested');
    console.log('📍 Session staff:', req.session.staff);
    // Check if user has Admin Assistant role
    if (req.session.staff && req.session.staff.position === 'Admin Assistant') {
        console.log('✅ Serving Admin Assistant dashboard');
        res.sendFile(path.join(__dirname, 'frontend', 'admin-assistant-dashboard.html'));
    } else {
        console.log('❌ Access denied to Admin Assistant dashboard - wrong role or no session');
        res.redirect('/staff/login');
    }
});

app.get('/customer-care/dashboard', requireStaffAuth, (req, res) => {
    console.log('🔍 Customer Care dashboard requested');
    console.log('📍 Session staff:', req.session.staff);
    // Check if user has Customer Care role
    if (req.session.staff && req.session.staff.position === 'Customer Care') {
        console.log('✅ Serving Customer Care dashboard');
        res.sendFile(path.join(__dirname, 'frontend', 'customer-care-dashboard.html'));
    } else {
        console.log('❌ Access denied to Customer Care dashboard - wrong role or no session');
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/dashboard', requireStaffAuth, (req, res) => {
    console.log('🔍 Supervisor dashboard requested');
    console.log('📍 Session staff:', req.session.staff);
    console.log('📍 Full session:', req.session);
    console.log('📍 Session ID:', req.sessionID);
    // Check if user has Supervisor role
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving Supervisor dashboard');
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-dashboard.html'));
    } else {
        console.log('❌ Access denied to Supervisor dashboard - wrong role or no session');
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/team-communication', requireStaffAuth, (req, res) => {
    console.log('🔍 Supervisor team communication requested');
    console.log('📍 Session staff:', req.session.staff);
    // Check if user has Supervisor role
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving Supervisor team communication');
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-team-communication.html'));
    } else {
        console.log('❌ Access denied to Supervisor team communication - wrong role or no session');
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/supervisor-team-communication.html', requireStaffAuth, (req, res) => {
    console.log('🔍 Supervisor team communication requested (HTML)');
    console.log('📍 Session staff:', req.session.staff);
    // Check if user has Supervisor role
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving Supervisor team communication');
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-team-communication.html'));
    } else {
        console.log('❌ Access denied to Supervisor team communication - wrong role or no session');
        res.redirect('/staff/login');
    }
});

// Additional supervisor routes
app.get('/lead-technician/support-tickets', requireStaffAuth, (req, res) => {
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        res.sendFile(path.join(__dirname, 'frontend', 'support-tickets.html'));
    } else {
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/service-assignments', requireStaffAuth, (req, res) => {
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        res.sendFile(path.join(__dirname, 'frontend', 'service-assignments.html'));
    } else {
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/renewals', requireStaffAuth, (req, res) => {
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        res.sendFile(path.join(__dirname, 'frontend', 'renewals.html'));
    } else {
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/website-bookings', requireStaffAuth, (req, res) => {
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        res.sendFile(path.join(__dirname, 'frontend', 'website-bookings.html'));
    } else {
        res.redirect('/staff/login');
    }
});

app.get('/lead-technician/settings', requireStaffAuth, (req, res) => {
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-settings.html'));
    } else {
        res.redirect('/staff/login');
    }
});

// Lead technician index route
app.get('/lead-technician/index.html', requireStaffAuth, (req, res) => {
    console.log('🔍 Lead technician index requested');
    console.log('📍 Session staff:', req.session.staff);
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving lead technician index - redirecting to dashboard');
        res.redirect('/lead-technician/dashboard');
    } else {
        console.log('❌ Access denied to lead technician index - wrong role or no session');
        res.redirect('/staff/login');
    }
});

// Direct supervisor dashboard route for backward compatibility
app.get('/supervisor-dashboard.html', requireStaffAuth, (req, res) => {
    console.log('🔍 Supervisor dashboard requested (direct route)');
    console.log('📍 Session staff:', req.session.staff);
    if (req.session.staff && req.session.staff.position === 'Supervisor') {
        console.log('✅ Serving Supervisor dashboard (direct route)');
        res.sendFile(path.join(__dirname, 'frontend', 'supervisor-dashboard.html'));
    } else {
        console.log('❌ Access denied to Supervisor dashboard - wrong role or no session');
        res.redirect('/staff/login');
    }
});

// Route to serve the blank Supervisor Dashboard
app.get('/supervisor/dashboard', requireStaffAuth, (req, res) => {
    console.log('🔍 Blank Supervisor dashboard requested');
    res.sendFile(path.join(__dirname, 'frontend', 'supervisor-dashboard.html'));
});

// Note: Client and Staff routes are defined above

// ✅ SQLite DB Connection and Server Startup
async function startServer() {
    try {
        await runMigrations(); // ⬅️ Auto-run table creation
        await createDefaultAdmin(); //Create default admin
        await seedInitialData(); // ⬅️ Seed sample data for clients and staff
        
        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
            console.log(`🏠 Landing page: http://localhost:${PORT}`);
            console.log(`� Unified login portal: http://localhost:${PORT}/login`);
            console.log(`�👤 CTIO (SysAdmin) login: http://localhost:${PORT}/admin/login`);
            console.log(`📱 Client login: http://localhost:${PORT}/client/login`);
            console.log(`👨‍💼 Staff login: http://localhost:${PORT}/staff/login`);
        });

        // Keep the process alive
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down server...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        });

    } catch (err) {
        console.error('❌ Migration/startup error:', err);
        process.exit(1);
    }
}

startServer();