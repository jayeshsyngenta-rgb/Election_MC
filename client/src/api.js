const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("adminToken");
}

async function getJSON(path, signal) {
  // cache: "no-store" stops the browser from sending conditional
  // requests (If-None-Match) and serving a stale cached body back on
  // a 304 response. This data (voter search results, status changes)
  // changes too frequently for HTTP caching to be safe here.
  const res = await fetch(`${BASE_URL}${path}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function postJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

async function patchJSON(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

async function getJSONAuthed(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("adminToken");
    const err = new Error("Unauthorized");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function downloadAuthed(path, filename) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("adminToken");
    const err = new Error("Unauthorized");
    err.unauthorized = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export const api = {
  getDistricts: () => getJSON("/meta/districts"),
  getTalukas: (district) =>
    getJSON(`/meta/talukas?district=${encodeURIComponent(district)}`),
  getVillages: (district, taluka) =>
    getJSON(
      `/meta/villages?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(taluka)}`,
    ),
  getInstitutes: (district, taluka, village) =>
    getJSON(
      `/meta/institutes?district=${encodeURIComponent(district)}&taluka=${encodeURIComponent(
        taluka,
      )}&village=${encodeURIComponent(village)}`,
    ),
  // Accepts an optional AbortSignal so an in-flight search can actually
  // be cancelled when a newer one starts, instead of silently racing
  // and letting whichever response arrives last win.
  searchVoters: (filters, signal) => {
    const params = new URLSearchParams(filters).toString();
    return getJSON(`/voters?${params}`, signal);
  },
  updateVoterStatus: (id, status) =>
    patchJSON(`/voters/${id}/status`, { status }),

  // Admin
  adminLogin: (username, password) =>
    postJSON("/admin/login", { username, password }),
  getAdminStats: () => getJSONAuthed("/admin/stats"),
  exportExcel: (filters) => {
    const params = new URLSearchParams(filters).toString();
    return downloadAuthed(`/voters/export/excel?${params}`, "voters.xlsx");
  },
  exportPdf: (filters) => {
    const params = new URLSearchParams(filters).toString();
    return downloadAuthed(`/voters/export/pdf?${params}`, "voters.pdf");
  },
};

export default BASE_URL;
