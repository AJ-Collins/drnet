const createRolesTable = require("../migrations/roles");
const createPermissionsTable = require("../migrations/permissions");
const createRolePermissionsTable = require("../migrations/role_permissions");

const seedRoles = require("./roles_seeder");
const seedPermissions = require("./permissions_seeder");
const seedRolePermissions = require("./role_permissions_seeder");

(async () => {
  try {
    await createRolesTable();
    await createPermissionsTable();
    await createRolePermissionsTable();

    await seedRoles();
    await seedPermissions();
    await seedRolePermissions();

    console.log("Seeding complete");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
})();
