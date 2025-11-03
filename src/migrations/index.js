const createAdminsTable = require('./admins');
const createBookingsTable = require('./bookings');
const createContactsTable = require('./contacts');
const createUsersTable = require('./client_users');
const createRenewalsTable = require('./renewals');
const createClientsTable = require('./clients');
const createClientPaymentsTable = require('./client_payments');
const createStaffTable = require('./staff');
const createStaffClientAssignmentsTable = require('./staff_client_assignments');
const createStaffTasksTable = require('./staff_tasks');
const createRolesTable = require('./roles');
const createStaffRolesTable = require('./staff_roles');
const createPermissionsTable = require('./permissions');
const createRolePermissionsTable = require('./role_permissions');

async function runMigrations() {
  console.log('Running all migrations...');
  
  await createAdminsTable();
  await createRolesTable();
  await createStaffRolesTable();
  await createPermissionsTable();
  await createRolePermissionsTable();
  await createUsersTable();
  await createBookingsTable();
  await createContactsTable();
  await createRenewalsTable();
  await createClientsTable();
  await createClientPaymentsTable();
  await createStaffTable();
  await createStaffClientAssignmentsTable();
  await createStaffTasksTable();

  console.log('All migrations completed');
}

module.exports = runMigrations;
