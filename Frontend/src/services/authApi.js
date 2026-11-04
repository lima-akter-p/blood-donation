import { API_BASE_URL } from "./apiBaseUrl";

async function request(path, { token, ...options } = {}) {
  let response;
  const isFormData = options.body instanceof FormData;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);
  const data = await request("/auth/avatar", {
    method: "POST",
    body: formData,
  });
  return data.avatar;
}

export async function register(details) {
  const data = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
  return data;
}

export async function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function loginWithGoogle(idToken, profile) {
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken, ...(profile ? { profile } : {}) }),
  });
}

export async function getCurrentUser(token) {
  const data = await request("/auth/me", { token });
  return data.user;
}

export async function updateCurrentUser(token, profile) {
  const data = await request("/auth/me", {
    token,
    method: "PATCH",
    body: JSON.stringify(profile),
  });
  return data.user;
}

export async function getAdminUsers(token, { page = 1, status } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);
  return request("/admin/users?" + query.toString(), { token });
}

export async function updateAdminUserStatus(token, userId, status) {
  const data = await request("/admin/users/" + encodeURIComponent(userId) + "/status", {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return data.user;
}

export async function updateAdminUserRole(token, userId, role) {
  const data = await request("/admin/users/" + encodeURIComponent(userId) + "/role", {
    token,
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
  return data.user;
}

export async function getAdminDashboardStats(token) {
  return request("/admin/dashboard", { token });
}

export async function getFundingSummary(token) {
  return request("/funding/summary", { token });
}
