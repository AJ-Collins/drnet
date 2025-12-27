const cron = require("node-cron");
const ProjectService = require("../services/ProjectService");
const ExpenseService = require("../services/ExpenseService");

cron.schedule("0 9 * * *", async () => {
  const delayed = await ProjectService.alertDelays(); // all projects
  const overBudget = await ExpenseService.budgetAlerts();
  // Send notifications via CommunicationService
});