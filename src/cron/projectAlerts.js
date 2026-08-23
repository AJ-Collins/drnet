const ProjectService = require("../services/ProjectService");
const ExpenseService = require("../services/ExpenseService");

async function runProjectAlerts() {
  const delayed = await ProjectService.alertDelays(); // all projects
  const overBudget = await ExpenseService.budgetAlerts();
  
  // Send notifications via CommunicationService
  return {
    delayed,
    overBudget,
  };
}

module.exports = { runProjectAlerts };