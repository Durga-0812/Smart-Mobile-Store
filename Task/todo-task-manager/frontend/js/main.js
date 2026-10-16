// App coordinator: stores filter state and connects reusable components.
import { taskApi } from "./api.js";
import { $, escapeHtml } from "./utils.js";
import { showToast } from "./components/toast.js";
import { renderTaskTable } from "./components/task_table.js";
import { renderTaskStats } from "./components/task_stats.js";
import { createTaskModal } from "./components/task_modal.js";

const state = {
  tasks: [],
  activeTab: "All",
  page: 1,
  pageSize: 10,
  search: "",
  priority: "All",
  deadline: "",
  overdueOnly: false,
};

const modal = createTaskModal({ onSaved: loadTasks, notify: showToast });

function currentFilters() {
  return {
    status: state.activeTab,
    search: state.search.trim(),
    priority: state.priority,
    overdue: state.overdueOnly,
  };
}

async function loadTasks() {
  $("taskTableBody").innerHTML = '<tr><td colspan="6" class="loading-cell">Loading your tasks...</td></tr>';
  try {
    const [filteredTasks, allTasks] = await Promise.all([
      taskApi.list(currentFilters()),
      taskApi.list(),
    ]);
    state.tasks = state.deadline
      ? filteredTasks.filter((task) => task.deadline === state.deadline)
      : filteredTasks;
    state.page = Math.min(state.page, Math.max(1, Math.ceil(state.tasks.length / state.pageSize)));
    renderTaskTable(state.tasks, state.page, state.pageSize);
    renderTaskStats(allTasks);
  } catch (error) {
    $("taskTableBody").innerHTML = `<tr><td colspan="6" class="loading-cell">${escapeHtml(error.message)}</td></tr>`;
    showToast(error.message, true);
  }
}

function selectTab(tab) {
  state.activeTab = tab.dataset.tab;
  state.page = 1;
  document.querySelectorAll(".tab").forEach((item) => {
    const selected = item === tab;
    item.classList.toggle("active", selected);
    item.setAttribute("aria-selected", String(selected));
  });
  loadTasks();
}

// Table actions use event delegation, so one listener serves every task row.
$("taskTableBody").addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const task = state.tasks.find((item) => item.id === id);

  try {
    if (action === "view" || action === "edit") {
      modal.open(task || await taskApi.get(id), action);
    } else if (action === "delete") {
      if (!confirm(`Delete “${task?.title || "this task"}”? This action cannot be undone.`)) return;
      await taskApi.remove(id);
      showToast("Task deleted.");
      await loadTasks();
    } else if (action === "status") {
      await taskApi.changeStatus(id, button.dataset.status);
      showToast(`Task marked ${button.dataset.status.toLowerCase()}.`);
      await loadTasks();
    }
  } catch (error) {
    showToast(error.message, true);
  }
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => selectTab(tab));
});

let searchTimer;
$("searchInput").addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = $("searchInput").value;
    state.page = 1;
    loadTasks();
  }, 250);
});

$("applyFilters").addEventListener("click", () => {
  state.priority = $("priorityFilter").value;
  state.deadline = $("deadlineFilter").value;
  state.overdueOnly = $("overdueOnly").checked;
  state.page = 1;
  loadTasks();
});

$("clearFilters").addEventListener("click", () => {
  $("priorityFilter").value = "All";
  $("deadlineFilter").value = "";
  $("overdueOnly").checked = false;
  $("searchInput").value = "";
  state.priority = "All";
  state.deadline = "";
  state.overdueOnly = false;
  state.search = "";
  state.page = 1;
  loadTasks();
});

$("pageSize").addEventListener("change", () => {
  state.pageSize = Number($("pageSize").value);
  state.page = 1;
  renderTaskTable(state.tasks, state.page, state.pageSize);
});
$("prevPage").addEventListener("click", () => {
  if (state.page > 1) state.page -= 1;
  renderTaskTable(state.tasks, state.page, state.pageSize);
});
$("nextPage").addEventListener("click", () => {
  const pageCount = Math.ceil(state.tasks.length / state.pageSize);
  if (state.page < pageCount) state.page += 1;
  renderTaskTable(state.tasks, state.page, state.pageSize);
});
$("refreshButton").addEventListener("click", loadTasks);
$("docsNav").addEventListener("click", () => window.open("/docs", "_blank", "noopener,noreferrer"));
$("overviewNav").addEventListener("click", () => {
  const allTab = document.querySelector('[data-tab="All"]');
  selectTab(allTab);
  window.scrollTo({ top: 0, behavior: "smooth" });
});
$("progressNav").addEventListener("click", () => {
  selectTab(document.querySelector('[data-tab="In progress"]'));
  document.querySelector(".tasks-section").scrollIntoView({ behavior: "smooth", block: "start" });
});
$("calendarNav").addEventListener("click", () => {
  $("deadlineFilter").focus();
  if (typeof $("deadlineFilter").showPicker === "function") $("deadlineFilter").showPicker();
});
$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("todo-theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});
if (localStorage.getItem("todo-theme") === "dark") document.body.classList.add("dark-mode");
$("todayLabel").textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "short", day: "numeric", month: "short", year: "numeric",
});

loadTasks();
