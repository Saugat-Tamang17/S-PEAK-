const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function getToken() {
  return localStorage.getItem("speak_token");
}

export function setToken(token) {
  localStorage.setItem("speak_token", token);
}

export function clearToken() {
  localStorage.removeItem("speak_token");
  localStorage.removeItem("speak_user_name");
}

export function isAuthenticated() {
  return Boolean(getToken());
}
export function getUserName() {
  return localStorage.getItem("speak_user_name");
}
 
function getAuthHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function authFetch(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res;
}

async function parseError(res) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    return data.message || data.error || text;
  } catch {
    return text || "Something went wrong. Try again.";
  }
}

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = await res.json();
  if (data.token) setToken(data.token);
  if (data.name) localStorage.setItem("speak_user_name", data.name);
  return data;
}

export async function googleLogin(idToken) {
  const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  const data = await res.json();
  if (data.token) setToken(data.token);
  if (data.name) localStorage.setItem("speak_user_name", data.name);
  return data;
}

export async function register(name,email, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name,email, password }),
  });

  if (!res.ok) {
    throw new Error(await parseError(res));
  }

  return res.json();
}