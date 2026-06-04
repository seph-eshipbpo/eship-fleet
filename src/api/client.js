const BASE_URL = import.meta.env.VITE_API_URL;
const APP_KEY  = import.meta.env.VITE_APP_KEY;

function getToken() {
  return localStorage.getItem("fleet_token");
}

async function request(method, path, body) {
  const headers = {
    "Content-Type":  "application/json",
    "Accept":        "application/json",
    "X-App-Key":     APP_KEY,
  };

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && getToken()) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    const message = data?.message || "Something went wrong.";
    const errors  = data?.errors  || null;
    const err     = new Error(message);
    err.status    = res.status;
    err.errors    = errors;
    throw err;
  }

  return data;
}

export const api = {
  get:    (path)        => request("GET",    path),
  post:   (path, body)  => request("POST",   path, body),
  put:    (path, body)  => request("PUT",    path, body),
  delete: (path)        => request("DELETE", path),
};
