const db = require("../config/db");

async function seedPermissions() {
  // Define permissions with explicit, fixed IDs
  const permissions = [
    { id: 1, name: "createUser" },
    { id: 2, name: "viewUsers" },
    { id: 3, name: "editUser" },
    { id: 4, name: "deleteUser" },

    { id: 5, name: "createClient" },
    { id: 6, name: "viewClients" },
    { id: 7, name: "editClient" },
    { id: 8, name: "deleteClient" },

    { id: 9, name: "createBooking" },
    { id: 10, name: "viewBookings" },
    { id: 11, name: "editBooking" },
    { id: 12, name: "deleteBooking" },

    { id: 13, name: "createInvoice" },
    { id: 14, name: "viewInvoices" },
    { id: 15, name: "recordPayment" },
    { id: 16, name: "viewPayments" },

    { id: 17, name: "createExpense" },
    { id: 18, name: "viewExpenses" },

    { id: 19, name: "createAnnouncement" },
    { id: 20, name: "viewAnnouncements" },

    { id: 21, name: "createTicket" },
    { id: 22, name: "viewTickets" },
    { id: 23, name: "replyTicket" },

    { id: 24, name: "manageRoles" },
    { id: 25, name: "managePermissions" },
  ];

  for (const perm of permissions) {
    // FIXED: Insert both the ID and the Name
    await db.query(`INSERT IGNORE INTO permissions (id, name) VALUES (?, ?)`, [
      perm.id,
      perm.name,
    ]);
  }

  console.log("Permissions seeded");
}

module.exports = seedPermissions;
