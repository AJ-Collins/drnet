const db = require("../config/db");

async function seedRolePermissions() {
  // get role IDs
  const [[admin]] = await db.query(`SELECT id FROM roles WHERE name = 'Admin'`);
  const [[supervisor]] = await db.query(
    `SELECT id FROM roles WHERE name = 'Supervisor'`
  );
  const [[staff]] = await db.query(`SELECT id FROM roles WHERE name = 'Staff'`);
  const [[client]] = await db.query(
    `SELECT id FROM roles WHERE name = 'Client'`
  );

  // get all permissions
  const [permissions] = await db.query(`SELECT * FROM permissions`);

  // Admin gets ALL
  for (const perm of permissions) {
    await db.query(
      `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
      [admin.id, perm.id]
    );
  }

  const supervisorExcluded = [
    "createInvoice",
    "viewInvoices",
    "recordPayment",
    "viewPayments",
    "createExpense",
    "viewExpenses",
  ];

  for (const perm of permissions) {
    if (!supervisorExcluded.includes(perm.name)) {
      await db.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [supervisor.id, perm.id]
      );
    }
  }

  // Staff allowed subset
  const staffAllowed = [
    "viewUsers",
    "createClient",
    "viewClients",
    "editClient",
    "createBooking",
    "viewBookings",
    "editBooking",
    "createInvoice",
    "viewInvoices",
    "recordPayment",
    "createExpense",
    "viewExpenses",
    "createAnnouncement",
    "viewAnnouncements",
    "createTicket",
    "viewTickets",
    "replyTicket",
  ];

  for (const perm of permissions) {
    if (staffAllowed.includes(perm.name)) {
      await db.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [staff.id, perm.id]
      );
    }
  }

  // Client very limited
  const clientAllowed = [
    "createTicket",
    "viewTickets",
    "replyTicket",
    "viewAnnouncements",
  ];

  for (const perm of permissions) {
    if (clientAllowed.includes(perm.name)) {
      await db.query(
        `INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`,
        [client.id, perm.id]
      );
    }
  }

  console.log("Role permissions seeded");
}

module.exports = seedRolePermissions;
