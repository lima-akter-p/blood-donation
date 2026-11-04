import { API_BASE_URL } from "./apiBaseUrl";

async function request(path, { token, ...options } = {}) {
  const headers = { Accept: "application/json", ...options.headers };
  if (options.body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = ["Bearer", token].join(" ");

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

export async function searchDonors({ bloodGroup, district, upazila, page = 1 }) {
  const query = new URLSearchParams({
    bloodGroup,
    district,
    upazila,
    page: String(page),
  });
  return request("/donors?" + query.toString());
}

export async function createDonationRequest(token, details) {
  return request("/donation-requests", {
    token,
    method: "POST",
    body: JSON.stringify(details),
  });
}

export async function getMyDonationRequests(token, { page = 1, status } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);
  return request("/donation-requests/mine?" + query.toString(), { token });
}

export async function getAllDonationRequests(token, { page = 1, status } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (status) query.set("status", status);
  return request("/donation-requests/all?" + query.toString(), { token });
}

export async function getAdminDonationRequest(token, requestId) {
  return request("/donation-requests/all/" + encodeURIComponent(requestId), { token });
}

export async function updateAdminDonationRequest(token, requestId, details) {
  return request("/donation-requests/all/" + encodeURIComponent(requestId), {
    token,
    method: "PATCH",
    body: JSON.stringify(details),
  });
}

export async function deleteAdminDonationRequest(token, requestId) {
  return request("/donation-requests/all/" + encodeURIComponent(requestId), {
    token,
    method: "DELETE",
  });
}

export async function getPendingDonationRequests({ page = 1, bloodGroup, district, upazila } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  if (bloodGroup) query.set("bloodGroup", bloodGroup);
  if (district) query.set("district", district);
  if (upazila) query.set("upazila", upazila);
  return request("/donation-requests?" + query.toString());
}

export async function getDonationRequest(token, requestId) {
  return request("/donation-requests/mine/" + encodeURIComponent(requestId), { token });
}

export async function getPendingDonationRequest(token, requestId) {
  return request("/donation-requests/" + encodeURIComponent(requestId), { token });
}

export async function confirmDonation(token, requestId) {
  return request("/donation-requests/" + encodeURIComponent(requestId) + "/donate", {
    token,
    method: "POST",
  });
}

export async function updateDonationRequest(token, requestId, details) {
  return request("/donation-requests/" + encodeURIComponent(requestId), {
    token,
    method: "PATCH",
    body: JSON.stringify(details),
  });
}

export async function deleteDonationRequest(token, requestId) {
  return request("/donation-requests/" + encodeURIComponent(requestId), {
    token,
    method: "DELETE",
  });
}

export async function updateDonationRequestStatus(token, requestId, status) {
  return request("/donation-requests/" + encodeURIComponent(requestId) + "/status", {
    token,
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getFundingHistory(token, { page = 1 } = {}) {
  const query = new URLSearchParams({ page: String(page) });
  return request("/funding?" + query.toString(), { token });
}

export async function createFundingCheckout(token, details) {
  return request("/funding/checkout", {
    token,
    method: "POST",
    body: JSON.stringify(details),
  });
}
