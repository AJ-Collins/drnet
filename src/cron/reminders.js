const TaskService = require("../services/TaskService");

// Run every day at 8 AM
async function sendReminders() {
  console.log("Running daily task reminders...");
  const remindedTasks = await TaskService.sendReminders();
  console.log(`Reminders processed for ${remindedTasks.length} tasks`);
}

module.exports = { sendReminders };