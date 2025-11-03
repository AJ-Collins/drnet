require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');

// Bootstrap modules
const runMigrations = require('./src/migrations/index');
const createDefaultAdmin = require('./src/migrations/createDefaultAdmin');

// Routes
const bookingRoutes = require('./src/routes/bookings');
const contactRoutes = require('./src/routes/contact');
const adminRoutes = require('./src/routes/admin');
const userRoutes = require('./src/routes/users');
const renewals = require('./src/routes/renewals');
const clientRoutes = require('./src/routes/client');
const staffRoutes = require('./src/routes/staff');

const app = express();

// === Sessions ===
app.use(session({
  secret: process.env.SESSION_SECRET || 'drnet-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

// === Middleware ===
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// === EJS Setup ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/admin')); // <-- points to admin folder

// === Static Assets ===
app.use('/admin/static', express.static(path.join(__dirname, 'frontend/assets'))); // css, js, images
// Keep old paths for backward compatibility (optional)
app.use('/admin/js', express.static(path.join(__dirname, 'frontend/assets/js')));
app.use('/admin/css', express.static(path.join(__dirname, 'frontend/assets/css')));
app.use('/admin/images', express.static(path.join(__dirname, 'frontend/assets/images')));
app.use('/admin/videos', express.static(path.join(__dirname, 'frontend/assets/videos')));

// === Auth Middleware ===
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.redirect('/admin/login');
}

function requireClientAuth(req, res, next) {
  if (req.session && req.session.client) return next();
  res.redirect('/client/login');
}

function requireStaffAuth(req, res, next) {
  if (req.session && req.session.staff) return next();
  res.redirect('/staff/login');
}
app.get('/admin/login', (req, res) => {
  res.render('layout', {
    pageTitle: 'Admin Login',
    pageSubtitle: 'Sign in to continue',
    currentPage: 'login'
  });
});

app.get('/admin/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/admin/login');
    });
  } else {
    res.redirect('/admin/login');
  }
});
// === ADMIN ROUTES (EJS) ===
const validPages = [
  'dashboard', 'manage-users', 'service-management',
  'support-tickets', 'finance', 'reports', 'settings',
  'register-user', 'profile', 'renewals', 'website-bookings',
  'invoice-generator', 'service-assignments', 'equipment-inventory',
  'admin-assistant-dashboard', 'supervisor-dashboard', 'deleted-users'
];

app.get('/admin/:page', (req, res) => {
  let page = req.params.page;

  if (!validPages.includes(page)) {
    return res.redirect('/admin/dashboard');
  }

  const title = page
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  res.render('layout', {
    pageTitle: title,
    pageSubtitle: `Manage ${title.toLowerCase()}`,
    currentPage: page
  });
});

// Fallback: /admin → dashboard
app.get('/admin', requireAdminAuth, (req, res) => {
  res.redirect('/admin/dashboard');
});

// === API Routes ===
app.use('/api/bookings', bookingRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/renewals', renewals);
app.use('/api/client', clientRoutes);
app.use('/api/staff', staffRoutes);

// === Frontend HTML Routes ===
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'frontend/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'frontend/register.html')));
app.get('/forgot_password', (req, res) => res.sendFile(path.join(__dirname, 'frontend/forgot_password.html')));

// === Error Handling ===
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// === Server Bootstrap ===
async function startServer() {
  try {
    console.log('Starting Dr.Net Server...');
    await runMigrations();
    console.log('Migrations complete.');
    await createDefaultAdmin();
    console.log('Default admin created.');

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    process.on('SIGINT', () => {
      console.log('\nShutting down...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();