const createRolesTable = require("./roles");
const createPermissionsTable = require("./permissions");
const createRolePermissionsTable = require("./role_permissions");

const createUsersTable = require("./users");

const createPackagesTable = require("./packages");
const createItemsTable = require("./items");

const createClientItemPurchasesTable = require("./client_item_purchases");
const createClientItemPaymentsTable = require("./client_item_payments");
const createClientPaymentsTable = require("./client_payments");
const createRenewalsTable = require("./renewals");
const createBookingsTable = require("./bookings");
const createClientPaymentReceiptsTable = require("./client_payment_receipt");
const createUserSubscriptionsTable = require("./user_subscriptions");
const createReports = require("./reports");
// HR-ASSISTANT
const createHrExpensesTable = require("./hr-expenses");
const createHrTasksTable = require("./hr-tasks");
const createHrBookingsTable = require("./hr-bookings");
const createHrCommsLogsTable = require("./hr-communication-logs");
const createHrInboxTable = require("./hr_inbox");
const createHrInboxReplyTable = require("./hr_inbox_reply");
const createSmsLogsTable = require("./create_sms_logs");

// Sales
const createSalesTable = require("./sales");

// Client Onboard
const createClientOnboardTable = require("./clients_onboard");
const clientsOnboardCommissionTable = require("./clients_onboard_commi");


//Seeders
const seedRoles = require("../seeders/roles_seeder");
const seedPermissions = require("../seeders/permissions_seeder");
const seedRolePermissions = require("../seeders/role_permissions_seeder");
const seedAdmin = require("../seeders/admin_seeder");

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

// Support tickets
const createSupportTicketsTable = require("./support_tickets");
const createSupportTicketMessagesTable = require("./support_ticket_messages");
const createTicketAssignmentsTable = require("./support_ticket_assignments");

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

  // Packages & items

  await createItemsTable();

  // Staff & related tables

  await createStaffSalariesTable();
  await createStaffPayslipsTable();
  await createStaffAttendanceTable();
  await createStaffClientAssignmentsTable();
  await createStaffSchedulesTable();

  // Communication & notifications
  await createAnnouncementsTable();

  // Support tickets
  await createSupportTicketsTable();
  await createSupportTicketMessagesTable();
  await createTicketAssignmentsTable();

  await createTeamMessagesTable();
  await createNotificationsTable();

  await createUserSubscriptionsTable();
  await createClientPaymentsTable();
  await createClientPaymentReceiptsTable();
  await createRenewalsTable();
  // await addSubscriptionColumns();

  await createClientItemPurchasesTable();
  await createClientItemPaymentsTable();
  await createBookingsTable();

  await createInvoicesTable();
  await createInvoiceItemsTable();
  await createPurchaseInvoiceTable();
  await createItemsPurchaseInvoiceTable();
  await createExpensesTable();
  await  createReports();

  //hr-assistant
  await createHrExpensesTable();
  await createHrTasksTable();
  await createHrBookingsTable();
  await createHrCommsLogsTable();
  await createHrInboxTable();
  await createHrInboxReplyTable();
  await createSmsLogsTable();

  // Sales
  await createSalesTable();

  // Clients onboard
  await createClientOnboardTable();
  await clientsOnboardCommissionTable();

  console.log("All migrations completed. Running seeders...");

  await seedRoles();
  await seedPermissions();
  await seedRolePermissions();
  await seedAdmin();
  console.log("Seeding complete!");
}

module.exports = runMigrations;
