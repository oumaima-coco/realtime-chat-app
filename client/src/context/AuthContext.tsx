// AuthContext — global auth state for the entire app.
//
// The pattern: a Provider component wraps the whole app at the top,
// holds the auth state, and exposes login/logout/register functions.
// Any component nested inside can call useAuth() to read the state
// and trigger auth actions.
//
// Flow on app startup:
//   1. AuthProvider mounts.
//   2. It checks localStorage for a saved token.
//   3. If found, it calls GET /auth/me to verify the token is still valid.
//   4. If valid, sets the user; if not, clears storage (logs out).
//
// Flow on login:
//   1. Component calls authLogin(username, password).
//   2. AuthContext calls the API, gets {user, token}.
//   3. Stores both in localStorage.
//   4. Sets user in React state — components re-render.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth.api";
import type { User } from "../api/auth.api";
import { STORAGE_KEYS } from "../api/axios";

// Shape of what the context provides to consumers.
interface AuthContextValue {
  user: User | null;            // The current user, or null if logged out.
  isLoading: boolean;            // True while we're verifying a stored token on startup.
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context with `undefined` as default. We'll throw if a component
// tries to use it without being wrapped in <AuthProvider> — fail fast on
// programmer errors.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// The Provider component. Wraps the app, holds the state, provides the value.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: check if there's a stored token and verify it.
  // useEffect with empty dependency array = "run once after the first render."
  useEffect(() => {
    async function verifyStoredAuth() {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

      // No stored auth — we're done loading, user stays null (logged out).
      if (!storedToken || !storedUser) {
        setIsLoading(false);
        return;
      }

      // Optimistically set the user from storage so the UI feels instant.
      // Then verify the token is still valid with the server. If verification
      // fails (token expired, user deleted), the axios interceptor will clear
      // storage and we'll log the user out cleanly.
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);

        // Verify with the server. If this 401s, the axios interceptor handles
        // the storage cleanup; we just need to clear React state.
        const response = await authApi.getMe();
        setUser(response.user);
        // Update storage with fresh user data (in case anything changed
        // server-side since the last session).
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.user));
      } catch {
        // Token verification failed. The axios interceptor has already
        // cleared localStorage; we just clear React state.
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyStoredAuth();
  }, []);

  async function login(username: string, password: string) {
    const { user: newUser, token } = await authApi.login(username, password);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    setUser(newUser);
  }

  async function register(username: string, password: string) {
    const { user: newUser, token } = await authApi.register(username, password);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// The hook components use to access the context.
// Wrapping useContext in our own hook gives us two benefits:
//   1. Better error message if a component forgets to use the Provider.
//   2. Consumers import a single function from a single place.
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}