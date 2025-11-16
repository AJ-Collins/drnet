const createRolesTable = require("./roles");
const createPermissionsTable = require("./permissions");
const createRolePermissionsTable = require("./role_permissions");

const createUsersTable = require("./users");
const createAdminsTable = require("./admins");

const createPackagesTable = require("./packages");
const createItemsTable = require("./items");

const createClientItemPurchasesTable = require("./client_item_purchases");
const createClientItemPaymentsTable = require("./client_item_payments");
const createClientPaymentsTable = require("./client_payments");
const createRenewalsTable = require("./renewals");
const createBookingsTable = require("./bookings");
const createClientPaymentReceiptsTable = require("./client_payment_receipt");
const createUserSubscriptionsTable = require("./user_subscriptions");

//Seeders
const seedRoles = require("../seeders/roles_seeder");
const seedPermissions = require("../seeders/permissions_seeder");
const seedRolePermissions = require("../seeders/role_permissions_seeder");

const {
  createInvoicesTable,
  createInvoiceItemsTable,
} = require("./client_invoices");
const {
  createPurchaseInvoiceTable,
  createItemsPurchaseInvoiceTable,
} = require("./items_purchase_invoice");

const createExpensesTable = require("./expenses");

const createStaffTable = require("./staff");
const createStaffSalariesTable = require("./staff_salaries");
const createStaffPayslipsTable = require("./staff_payslips");
const createStaffAttendanceTable = require("./staff_attendance");
const createStaffClientAssignmentsTable = require("./staff_client_assignments");
const createStaffSchedulesTable = require("./staff_schedules");

const createAnnouncementsTable = require("./announcements");
const createSupportTicketsTable = require("./support_tickets");
const createSupportTicketMessagesTable = require("./support_ticket_messages");
const createTeamMessagesTable = require("./team_messages");
const createNotificationsTable = require("./notifications"); // added notifications table

async function runMigrations() {
  console.log("Running all migrations...");

  // Roles & permissions first
  await createRolesTable();
  await createPermissionsTable();
  await createRolePermissionsTable();

  // Users and admins
  await createPackagesTable();
  await createUsersTable();
  await createStaffTable();
  await createAdminsTable();

  // Packages & items

  await createItemsTable();

  // Client purchases, payments, invoices (dependent on users, items, packages)
  await createClientItemPurchasesTable();
  await createClientItemPaymentsTable();
  await createClientPaymentsTable();
  await createRenewalsTable();
  await createBookingsTable();
  await createClientPaymentReceiptsTable();
  await createInvoicesTable();
  await createInvoiceItemsTable();
  await createPurchaseInvoiceTable();
  await createItemsPurchaseInvoiceTable();
  await createExpensesTable();

  // Staff & related tables

  await createStaffSalariesTable();
  await createStaffPayslipsTable();
  await createStaffAttendanceTable();
  await createStaffClientAssignmentsTable();
  await createStaffSchedulesTable();

  // Communication & notifications
  await createAnnouncementsTable();
  await createSupportTicketsTable();
  await createSupportTicketMessagesTable();
  await createTeamMessagesTable();
  await createNotificationsTable();

  await createUserSubscriptionsTable();

  console.log("All migrations completed. Running seeders...");

  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();

  console.log("Seeding complete!");
}

module.exports = runMigrations;
