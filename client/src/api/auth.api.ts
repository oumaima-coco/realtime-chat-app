// Auth API — the functions our frontend calls when interacting with
// the backend's /auth endpoints.
//
// Each function:
//   1. Takes typed input parameters.
//   2. Calls the backend via our pre-configured axios instance.
//   3. Returns the typed response data.
//
// Errors are passed through (not caught here). The caller (LoginForm,
// RegisterForm, AuthContext) decides how to display them to the user.

import { api } from "./axios";

// Shape of a user as returned by our backend (from PublicUser in auth.service.ts).
// We re-define it here to avoid importing across the client/server boundary —
// the two codebases are deployed separately and shouldn't share types directly.
export interface User {
  id: string;
  username: string;
  createdAt: string;  // JSON serializes Dates as strings.
}

export interface AuthResponse {
  user: User;
  token: string;
}

// POST /auth/register
export async function register(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", {
    username,
    password,
  });
  return response.data;
}

// POST /auth/login
export async function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", {
    username,
    password,
  });
  return response.data;
}

// GET /auth/me
// Verifies the current token and returns the user info.
// Used on app startup to confirm a stored token is still valid.
export async function getMe(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>("/auth/me");
  return response.data;
}