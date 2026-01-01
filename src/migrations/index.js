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
const addSubscriptionColumns = require("./addSubscriptionColumns");
const createReports = require("./reports");
// HR
const createHrProjects = require("./hr_projects");
const createHrRequests = require("./hr_requests");
const createHrResources = require("./hr_resources");
const createTasksTable = require("./hr_tasks");
const createCommentsTable = require("./hr_comments");
const createFoldersTable = require("./hr_folders");
const createDocumentsTable = require("./hr_documents");
const createDocumentVersionsTable = require("./hr_document_versions");
const createReportAttachmentsTable = require("./hr_report_attachments");

//Seeders
const seedRoles = require("../seeders/roles_seeder");
const seedPermissions = require("../seeders/permissions_seeder");
const seedRolePermissions = require("../seeders/role_permissions_seeder");
const seedAdmin = require("../seeders/admin_seeder");
const seedBookings = require("../seeders/bookings_seeder");
const usersSeeder = require("../seeders/users_seeder");
const seedUserSubscriptions = require("../seeders/seed_user_subscriptions");
const seedRenewals = require("../seeders/renewals_seed");

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

  //hr
  await createHrProjects();
  await createHrRequests();
  await createHrResources();
  await createTasksTable();
  await createCommentsTable();
  await createFoldersTable ();
  await createDocumentsTable();
  await createDocumentVersionsTable();
  await createReportAttachmentsTable();

  console.log("All migrations completed. Running seeders...");

  //await seedRoles();
  //await seedPermissions();
  //await seedRolePermissions();
  await seedAdmin();
  //await seedBookings();
  //await usersSeeder();
  //await seedUserSubscriptions();
  //await seedRenewals();
  console.log("Seeding complete!");
}

module.exports = runMigrations;
