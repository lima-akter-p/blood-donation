import { API_BASE_URL } from "./apiBaseUrl";

async function request(path, token, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
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

export function getNotifications(token, page = 1) {
  return request(`/notifications?page=${page}`, token);
}

export function getUnreadNotificationCount(token) {
  return request("/notifications/unread-count", token);
}

export function markNotificationRead(token, notificationId) {
  return request(`/notifications/${encodeURIComponent(notificationId)}/read`, token, {
    method: "PATCH",
  });
}

export function markAllNotificationsRead(token) {
  return request("/notifications/read-all", token, { method: "PATCH" });
}
