// Register page — same structure as Login, but calls AuthContext.register().
// Register also validates inputs client-side to match the backend's rules.

import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../context/AuthContext";

// The SAME validation rules as the backend (see server/src/schemas/auth.schema.ts).
// Defining them client-side lets us catch errors BEFORE making a network round-trip.
// The backend still validates too — never trust the client alone, but a fast
// client-side check is a nice UX improvement.
const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    // Validate locally first. If invalid, show the first error and stop —
    // don't even bother making the network call.
    const parseResult = registerSchema.safeParse({ username, password });
    if (!parseResult.success) {
      setErrorMessage(parseResult.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      await register(username, password);
      navigate("/chat");
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--centered">
      <h1>Create an account</h1>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </label>

        {errorMessage && (
          <div className="form-error">{errorMessage}</div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

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
  return "Registration failed. Please try again.";
}

export default Register;