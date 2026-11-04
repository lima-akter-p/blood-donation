import { API_BASE_URL } from "./apiBaseUrl";

async function request(path, { token, ...options } = {}) {
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Unable to reach the LifeDrop server. Check your connection and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("The server returned an unexpected response. Please try again later.");
  }
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "The request could not be completed.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function submitContactMessage(details) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function getContactMessages(token, { page = 1 } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  return request(`/contact/messages?${query}`, { token });
}

export async function markContactMessageRead(token, messageId) {
  return request(`/contact/messages/${encodeURIComponent(messageId)}/read`, {
    token,
    method: "PATCH",
  });
}
