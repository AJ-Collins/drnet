const createRolesTable = require("../migrations/roles");
const createPermissionsTable = require("../migrations/permissions");
const createRolePermissionsTable = require("../migrations/role_permissions");
const seedRoles = require("./roles_seeder");
const seedPermissions = require("./permissions_seeder");
const seedRolePermissions = require("./role_permissions_seeder");
const seedAdmin = require("./admin_seeder");
const seedBookings = require("./bookings_seeder");
const usersSeeder = require("./users_seeder");
const seedUserSubscriptions = require("./seed_user_subscriptions");
const seedRenewals = require("./renewals_seeder");

async function runSeeders() {
  try {
    await createRolesTable();
    await createPermissionsTable();
    await createRolePermissionsTable();
    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();
    await seedAdmin();
    await seedBookings();
    await usersSeeder();
    await seedUserSubscriptions();
    await seedRenewals();
    console.log("Seeding complete");
  } catch (err) {
    console.error("Seeding failed:", err);
    throw err;
  }
}

module.exports = runSeeders;
