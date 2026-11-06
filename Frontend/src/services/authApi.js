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
  const { birthCertificate, ...fields } = details;
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) body.append(key, String(value));
  });
  if (birthCertificate) body.append("birthCertificate", birthCertificate);
  const data = await request("/auth/register", {
    method: "POST",
    body,
  });
  return data;
}

export async function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function loginWithGoogle(idToken, profile, birthCertificate) {
  if (profile) {
    const body = new FormData();
    body.append("idToken", idToken);
    body.append("profile", JSON.stringify(profile));
    if (birthCertificate) body.append("birthCertificate", birthCertificate);
    return request("/auth/google", { method: "POST", body });
  }
  return request("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export async function resubmitDonorVerification(token, { dateOfBirth, documentConsent, birthCertificate }) {
  const body = new FormData();
  body.append("dateOfBirth", dateOfBirth);
  body.append("documentConsent", String(documentConsent));
  body.append("birthCertificate", birthCertificate);
  const data = await request("/auth/donor-verification", {
    token,
    method: "POST",
    body,
  });
  return data.user;
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

export async function getAdminDonorVerifications(token) {
  return request("/admin/donor-verifications", { token });
}

export async function getAdminDonorCertificate(token, userId) {
  let response;
  try {
    response = await fetch(
      `${API_BASE_URL}/admin/donor-verifications/${encodeURIComponent(userId)}/document`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch {
    throw new Error("Unable to reach the LifeDrop server. Check your connection and try again.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "The verification document could not be loaded.");
  }
  return response.blob();
}

export async function reviewAdminDonorVerification(token, userId, status) {
  return request(`/admin/donor-verifications/${encodeURIComponent(userId)}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getFundingSummary(token) {
  return request("/funding/summary", { token });
}
