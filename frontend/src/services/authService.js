import axios from "axios";
import { API_BASE_URL } from "../config/env";

const TOKEN_KEY = "fst_auth_token";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function setAuthToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function getAuthRole() {
  const token = getAuthToken();
  if (!token) return "";
  const payload = decodeJwtPayload(token);
  return payload?.role || "";
}

export function isAdmin() {
  return getAuthRole() === "admin";
}

export async function login({ email, password }) {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  const token = response?.data?.token;
  if (!token) throw new Error("Login did not return a token.");
  setAuthToken(token);
  return token;
}

export async function register({ email, password }) {
  await axios.post(`${API_BASE_URL}/auth/register`, { email, password });
}
