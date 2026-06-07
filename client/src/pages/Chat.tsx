// Chat page — placeholder for the real chat UI.
//
// PHASE 6: just shows who's logged in and offers a logout button.
// We'll replace this with the real chat UI in Phases 7+.

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="page">
      <header className="chat-header">
        <div>
          <h1>Chat</h1>
          <p>
            Signed in as <strong>{user?.username}</strong>
          </p>
        </div>
        <button onClick={handleLogout} className="button-secondary">
          Log out
        </button>
      </header>

      <p>The real chat UI lands here in Phase 7+.</p>
    </div>
  );
}

export default Chat;