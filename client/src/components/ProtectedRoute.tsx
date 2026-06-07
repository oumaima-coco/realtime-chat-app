// ProtectedRoute — a wrapper that only renders its children if the user
// is logged in. If not, redirects to /login.
//
// Usage in App.tsx:
//   <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
//
// Why a component instead of a hook? Routing in React Router v6 is
// component-based, so wrapping the route element keeps the routing
// declaration declarative and readable.

import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  // Show a tiny loading state while we're verifying the stored token.
  // Without this, a brief flash of /login would show while the GET /auth/me
  // request is in flight on page reload — bad UX.
  if (isLoading) {
    return (
      <div className="page page--centered">
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  // Not logged in → redirect to /login.
  // `replace` swaps the current history entry instead of pushing a new one,
  // so the browser back button doesn't loop the user back to the protected
  // page they were just kicked from.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render the protected children as-is.
  return <>{children}</>;
}