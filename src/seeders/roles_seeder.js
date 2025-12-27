const db = require("../config/db");

async function seedRoles() {
  const roles = [
    { id: 1, name: "Admin" },
    { id: 2, name: "Supervisor" },
    { id: 3, name: "Staff" },    
    { id: 4, name: "Client" },
    { id: 5, name: "Customer-Care"},
    { id: 6, name: "hr-assistant"}
  ];

  for (const role of roles) {
    await db.query(`INSERT IGNORE INTO roles (id, name) VALUES (?, ?)`, [
      role.id,
      role.name,
    ]);
  }

  console.log("Roles seeded");
}

module.exports = seedRoles;
