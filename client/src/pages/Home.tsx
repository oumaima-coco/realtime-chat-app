// Home page — the landing page users see when they visit "/".

import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="page">
      <div className="home-hero">
        <span className="home-hero-badge">Realtime · Multi-room</span>
        <h1>Welcome to Realtime Chat</h1>
        <p>
          A multi-room chat application built to learn modern full-stack
          patterns — React, Node, Socket.io, and PostgreSQL.
        </p>
      </div>

      <nav className="auth-nav">
        <Link to="/login">Log in</Link>
        <Link to="/register">Create an account</Link>
      </nav>
    </div>
  );
}

export default Home;