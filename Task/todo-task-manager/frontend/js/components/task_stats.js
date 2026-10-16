import { $ } from "../utils.js";

// Update the dashboard cards using the complete task list.
export function renderTaskStats(tasks) {
  $("totalCount").textContent = tasks.length;
  $("pendingCount").textContent = tasks.filter((task) => task.status === "Pending").length;
  $("completedCount").textContent = tasks.filter((task) => task.status === "Completed").length;
  $("overdueCount").textContent = tasks.filter((task) => task.is_overdue).length;
  $("allTabCount").textContent = tasks.length;
}
