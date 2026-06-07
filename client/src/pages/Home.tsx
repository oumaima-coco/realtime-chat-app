// Home page — welcome screen for logged-out users.
// If the user is already logged in, redirect to /chat.

import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, isLoading } = useAuth();

  // Wait for the initial token verification before deciding what to show.
  // Otherwise the page might flash the home screen briefly before redirecting.
  if (isLoading) {
    return (
      <div className="page page--centered">
        <p style={{ color: "var(--color-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  // Already logged in — straight to chat.
  if (user) {
    return <Navigate to="/chat" replace />;
  }

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