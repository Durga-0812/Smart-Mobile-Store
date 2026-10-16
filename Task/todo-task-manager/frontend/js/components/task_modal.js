import { taskApi } from "../api.js";
import { $ } from "../utils.js";

// This component owns the create, edit, view, and validation form.
export function createTaskModal({ onSaved, notify }) {
  function open(task = null, mode = "edit") {
    $("taskForm").reset();
    $("taskId").value = task?.id ?? "";
    $("taskTitle").value = task?.title ?? "";
    $("taskDescription").value = task?.description ?? "";
    $("taskDeadline").value = task?.deadline ?? "";
    $("taskPriority").value = task?.priority ?? "Medium";
    $("taskStatus").value = task?.status ?? "Pending";
    $("descriptionLength").textContent = $("taskDescription").value.length;

    $("modalTitle").textContent = mode === "view"
      ? "Task details" : task ? "Edit task" : "Create new task";
    $("saveTaskButton").textContent = task ? "Save Changes" : "Create Task";
    $("saveTaskButton").classList.toggle("hidden", mode === "view");
    $("taskTitle").readOnly = mode === "view";
    $("taskDescription").readOnly = mode === "view";
    $("taskDeadline").disabled = mode === "view";
    $("taskPriority").disabled = mode === "view";
    $("taskStatus").disabled = mode === "view";
    $("cancelModalButton").textContent = mode === "view" ? "Close" : "Cancel";

    $("titleError").classList.add("hidden");
    $("formError").classList.add("hidden");
    $("taskTitle").classList.remove("input-invalid");
    $("taskModalBackdrop").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (mode !== "view") setTimeout(() => $("taskTitle").focus(), 60);
  }

  function close() {
    $("taskModalBackdrop").classList.add("hidden");
    document.body.style.overflow = "";
  }

  $("createTaskButton").addEventListener("click", () => open());
  $("emptyCreateButton").addEventListener("click", () => open());
  $("closeModalButton").addEventListener("click", close);
  $("cancelModalButton").addEventListener("click", close);
  $("taskModalBackdrop").addEventListener("click", (event) => {
    if (event.target === $("taskModalBackdrop")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("taskModalBackdrop").classList.contains("hidden")) close();
  });
  $("taskDescription").addEventListener("input", () => {
    $("descriptionLength").textContent = $("taskDescription").value.length;
  });
  $("taskTitle").addEventListener("input", () => {
    $("titleError").classList.add("hidden");
    $("taskTitle").classList.remove("input-invalid");
  });

  $("taskForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = $("taskTitle").value.trim();
    if (!title) {
      $("titleError").classList.remove("hidden");
      $("taskTitle").classList.add("input-invalid");
      $("taskTitle").focus();
      return;
    }

    const task = {
      title,
      description: $("taskDescription").value.trim(),
      deadline: $("taskDeadline").value || null,
      priority: $("taskPriority").value,
      status: $("taskStatus").value,
    };
    const id = $("taskId").value;
    $("saveTaskButton").disabled = true;
    $("saveTaskButton").textContent = "Saving...";

    try {
      if (id) await taskApi.update(id, task);
      else await taskApi.create(task);
      close();
      notify(id ? "Task updated successfully." : "Task created successfully.");
      await onSaved();
    } catch (error) {
      $("formError").textContent = error.message;
      $("formError").classList.remove("hidden");
    } finally {
      $("saveTaskButton").disabled = false;
      $("saveTaskButton").textContent = id ? "Save Changes" : "Create Task";
    }
  });

  return { open, close };
}
