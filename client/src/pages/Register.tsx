// Register page — placeholder form. Wired up in Phase 6.

import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="page page--centered">
      <h1>Create an account</h1>

      <form className="auth-form">
        <label>
          Username
          <input type="text" name="username" autoComplete="username" />
        </label>

        <label>
          Password
          <input type="password" name="password" autoComplete="new-password" />
        </label>

        <button type="submit">Create account</button>
      </form>

      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;