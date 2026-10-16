// Small helper functions reused by multiple components.
export const $ = (id) => document.getElementById(id);

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function statusClass(status) {
  if (status === "Completed") return "status-completed";
  if (status === "In progress") return "status-in-progress";
  return "status-pending";
}

export function priorityClass(priority) {
  return `priority-${String(priority || "medium").toLowerCase()}`;
}
