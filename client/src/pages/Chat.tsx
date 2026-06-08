// Chat page — the heart of the app.
//
// Responsibilities:
//   - Connect to the Socket.io server via useSocket hook
//   - Subscribe to "message:new" events to receive incoming messages
//   - Render the list of messages received
//   - Provide a form to send messages via "message:send"
//   - Show online/offline status
//
// Phase 7 keeps things simple: one global lobby, no rooms, no persistence.
// Messages live in component state — they vanish on page refresh.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import type { ChatMessage } from "../types/socket.types";

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();

  // Local state: the list of messages and the current draft input.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  // A "ref" — a way for React to hold a reference to a DOM element.
  // We use it to auto-scroll the messages list to the bottom when new
  // messages arrive (a classic chat UX pattern).
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Effect: subscribe to incoming messages when the socket is ready.
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: ChatMessage) {
      // Append the new message. Using the function form of setState here
      // (prev => [...prev, message]) avoids stale-state bugs when multiple
      // messages arrive in quick succession.
      setMessages((prev) => [...prev, message]);
    }

    socket.on("message:new", handleNewMessage);

    // Cleanup: unsubscribe when the component unmounts or socket changes.
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  // Effect: auto-scroll to bottom whenever messages change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);

    const content = draft.trim();
    if (content.length === 0) return;
    if (!socket || !isConnected) {
      setSendError("Not connected to the server");
      return;
    }

    // Emit the event with an acknowledgment callback.
    // The server processes the message and calls our callback with the result.
    socket.emit("message:send", { content }, (response) => {
      if (response.ok) {
        // Server accepted the message. Clear the input.
        // We don't add the message to state here — the server will
        // broadcast it back to us via "message:new", which our subscription
        // above will handle. Single source of truth: the server.
        setDraft("");
      } else {
        setSendError(response.error);
      }
    });
  }

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div>
          <h1>Lobby</h1>
          <p>
            Signed in as <strong>{user?.username}</strong> ·{" "}
            <span className={isConnected ? "status-online" : "status-offline"}>
              {isConnected ? "Online" : "Connecting…"}
            </span>
          </p>
        </div>
        <button onClick={handleLogout} className="button-secondary">
          Log out
        </button>
      </header>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">
            No messages yet. Be the first to say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div
                key={msg.id}
                className={`chat-message ${isMine ? "chat-message--mine" : ""}`}
              >
                <div className="chat-message-meta">
                  <strong>{msg.senderUsername}</strong>
                  <span className="chat-message-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="chat-message-body">{msg.content}</div>
              </div>
            );
          })
        )}
        {/* Invisible anchor used by the auto-scroll effect. */}
        <div ref={messagesEndRef} />
      </div>

      {sendError && <div className="form-error">{sendError}</div>}

      <form className="chat-composer" onSubmit={handleSubmit}>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          disabled={!isConnected}
          autoComplete="off"
        />
        <button type="submit" disabled={!isConnected || draft.trim().length === 0}>
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;