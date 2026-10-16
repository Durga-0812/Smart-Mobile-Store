import { $, escapeHtml, formatDate, statusClass, priorityClass } from "../utils.js";

const icons = {
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>',
  delete: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/></svg>',
  view: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  done: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
};

// This component only draws the table. It does not fetch data or update the database.
export function renderTaskTable(tasks, page, pageSize) {
  const body = $("taskTableBody");
  const emptyState = $("emptyState");
  const tableWrap = body.closest(".table-wrap");
  const total = tasks.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const visibleTasks = tasks.slice(startIndex, startIndex + pageSize);

  emptyState.classList.toggle("hidden", total !== 0);
  tableWrap.classList.toggle("hidden", total === 0);

  if (visibleTasks.length === 0) {
    body.innerHTML = "";
  } else {
    body.innerHTML = visibleTasks.map((task) => {
      const title = escapeHtml(task.title);
      const description = escapeHtml(task.description || "");
      const dueDate = task.deadline
        ? `<span>${formatDate(task.deadline)}</span>${task.is_overdue ? '<span class="overdue-label">OVERDUE</span>' : ""}`
        : "—";
      const nextStatus = task.status === "Completed" ? "Pending" : "Completed";

      return `<tr>
        <td class="task-title-cell"><span class="task-title" title="${title}">${title}</span>${description ? `<span class="task-description" title="${description}">${description}</span>` : ""}</td>
        <td><span class="priority-badge ${priorityClass(task.priority)}">${escapeHtml(task.priority)}</span></td>
        <td><span class="status-badge ${statusClass(task.status)}">${escapeHtml(task.status)}</span></td>
        <td>${formatDate((task.created_at || "").slice(0, 10))}</td>
        <td>${dueDate}</td>
        <td><div class="action-buttons">
          <button class="action-button view" title="View task" aria-label="View ${title}" data-action="view" data-id="${task.id}">${icons.view}</button>
          <button class="action-button edit" title="Edit task" aria-label="Edit ${title}" data-action="edit" data-id="${task.id}">${icons.edit}</button>
          <button class="action-button status-change" title="Mark ${nextStatus.toLowerCase()}" aria-label="Mark ${title} ${nextStatus.toLowerCase()}" data-action="status" data-status="${nextStatus}" data-id="${task.id}">${icons.done}</button>
          <button class="action-button delete" title="Delete task" aria-label="Delete ${title}" data-action="delete" data-id="${task.id}">${icons.delete}</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  const shownStart = total ? startIndex + 1 : 0;
  const shownEnd = Math.min(startIndex + pageSize, total);
  $("pageRange").textContent = total ? `${shownStart}–${shownEnd} of ${total} tasks` : "0 tasks";
  $("prevPage").disabled = safePage <= 1;
  $("nextPage").disabled = safePage >= totalPages;
  return safePage;
}
