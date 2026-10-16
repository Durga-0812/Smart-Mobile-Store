// All HTTP requests live in one reusable module.
const API_URL = "/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Cannot connect to FastAPI. Check that the server is running.");
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(", ")
      : detail || "Something went wrong.";
    throw new Error(message);
  }
  return data;
}

function makeQuery(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "All" && value !== false) {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

// Named methods make API usage clear in the rest of the frontend.
export const taskApi = {
  list: (filters = {}) => {
    const query = makeQuery(filters);
    return request(`/tasks${query ? `?${query}` : ""}`);
  },
  get: (id) => request(`/tasks/${id}`),
  create: (task) => request("/tasks", { method: "POST", body: JSON.stringify(task) }),
  update: (id, task) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(task) }),
  changeStatus: (id, status) => request(`/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
  remove: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
