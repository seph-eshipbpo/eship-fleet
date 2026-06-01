import { api } from "./client";

export function login(email, password) {
  return api.post("/api/auth/login", { email, password });
}

export function logout() {
  return api.post("/api/auth/logout");
}

export function me() {
  return api.get("/api/auth/me");
}

export function forgotPassword(email) {
  return api.post("/api/auth/forgot-password", { email });
}

export function resetPassword(token, email, password, password_confirmation) {
  return api.post("/api/auth/reset-password", {
    token,
    email,
    password,
    password_confirmation,
  });
}
