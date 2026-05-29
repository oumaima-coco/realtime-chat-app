// Login page — collects credentials.
// PHASE 5: placeholder form, doesn't submit yet. Wired up in Phase 6.

import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="page page--centered">
      <h1>Log in</h1>

      <form className="auth-form">
        <label>
          Username
          <input type="text" name="username" autoComplete="username" />
        </label>

        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" />
        </label>

        <button type="submit">Log in</button>
      </form>

      <p>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

export default Login;