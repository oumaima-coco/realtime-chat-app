// 404 page for URLs that don't match any defined route.

import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page">
      <h1>404 — Page not found</h1>
      <p>The page you were looking for doesn't exist.</p>
      <Link to="/">Back to home</Link>
    </div>
  );
}

export default NotFound;