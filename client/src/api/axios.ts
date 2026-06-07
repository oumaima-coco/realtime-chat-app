// Pre-configured Axios instance for all backend API calls.
//
// Why a shared instance instead of importing axios directly everywhere?
//   - One base URL: change the API location in one place.
//   - One auth interceptor: every request automatically includes the JWT.
//   - One error handling pattern: 401 responses can trigger global logout.
//
// Anywhere in the app that calls the backend, it imports `api` from here:
//   import { api } from "../api/axios";
//   const response = await api.post("/auth/login", { username, password });

import axios from "axios";

// Read the API URL from env. Vite replaces `import.meta.env.VITE_API_URL`
// at build time with the actual value from .env.
// The "!" tells TypeScript "I'm sure this is defined" — if .env is missing,
// the app will crash loudly at startup rather than silently call undefined.
const API_URL = import.meta.env.VITE_API_URL!;

// Constants for localStorage keys. Centralized so we never have typos
// like "user_token" vs "userToken" in different files.
export const STORAGE_KEYS = {
  TOKEN: "chat_auth_token",
  USER: "chat_auth_user",
} as const;

// Create the axios instance with default settings every request will use.
export const api = axios.create({
  baseURL: API_URL,
  // Send cookies cross-origin if we ever start using them. Doesn't hurt.
  withCredentials: true,
});

// REQUEST INTERCEPTOR — runs BEFORE every request leaves the browser.
// We use it to automatically attach the JWT to the Authorization header
// if we have one stored.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    // Add the Bearer token. The backend's requireAuth middleware expects
    // exactly this header format: "Authorization: Bearer <jwt>".
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR — runs AFTER every response comes back.
// We use it to detect 401 responses (auth failed/expired) and clear the
// stored token. This way, when a token expires, the next request that
// fails will trigger a clean "log them out" effect on the frontend.
api.interceptors.response.use(
  // First arg: success handler (returns the response unchanged).
  (response) => response,
  // Second arg: error handler.
  (error) => {
    if (error.response?.status === 401) {
      // Token is gone, expired, or invalid. Clear stored auth so the
      // user gets bounced to login on the next interaction.
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      // Note: we don't redirect here. The AuthContext will detect the
      // missing token and update React state, which triggers the route
      // guard to redirect. Keeps concerns separated.
    }
    // Re-throw so the calling code (login form, etc.) can still handle
    // the error and show a useful message.
    return Promise.reject(error);
  },
);