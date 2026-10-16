import { $ } from "../utils.js";

let timerId;

// One shared notification component used by all actions.
export function showToast(message, isError = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  clearTimeout(timerId);
  timerId = setTimeout(() => toast.classList.remove("show"), 3000);
}
