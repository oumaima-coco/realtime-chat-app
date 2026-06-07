// Login page — collects credentials and calls AuthContext.login().
// On success, redirects to /chat. On failure, displays the error.

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  // useNavigate gives us a function to change the URL programmatically.
  // We use it after a successful login to send the user to /chat.
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state — three pieces:
  //   - username/password: what the user is typing.
  //   - errorMessage: a string we display if login fails (or null = no error).
  //   - isSubmitting: true while the API call is in flight. Used to disable
  //     the button so users don't double-submit.
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submit handler. React passes us a synthetic event; we call
  // preventDefault to stop the browser's default behavior (which would
  // be a full page reload — we want SPA behavior).
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
      // Login succeeded — AuthContext has updated. Redirect to chat.
      navigate("/chat");
    } catch (err) {
      // The error from axios. Try to pull the message from the response;
      // otherwise show a generic fallback.
      const message = extractErrorMessage(err);
      setErrorMessage(message);
    } finally {
      // Either way, the request is done — re-enable the button.
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--centered">
      <h1>Log in</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          Username
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        {/* Error banner — only renders if errorMessage is non-null.
            `&&` short-circuits: if the left side is falsy, JSX renders nothing. */}
        {errorMessage && (
          <div className="form-error">{errorMessage}</div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

// Helper: extract a human-friendly error message from an axios error.
// Axios errors have a nested structure: err.response.data.error for our backend.
function extractErrorMessage(err: unknown): string {
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: { data?: { error?: string } } }).response
      ?.data?.error === "string"
  ) {
    return (err as { response: { data: { error: string } } }).response.data.error;
  }
  return "Login failed. Please try again.";
}

export default Login;