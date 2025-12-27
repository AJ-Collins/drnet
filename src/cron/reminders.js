const cron = require("node-cron");
const TaskService = require("../services/TaskService");

// Run every day at 8 AM
cron.schedule("0 8 * * *", async () => {
  console.log("Running daily task reminders...");
  const remindedTasks = await TaskService.sendReminders();
  console.log(`Reminders processed for ${remindedTasks.length} tasks`);
});