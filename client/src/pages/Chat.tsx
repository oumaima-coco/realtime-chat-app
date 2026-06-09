// Chat page — multi-room edition.
//
// Layout: sidebar on the left (room list), main pane on the right (messages).
// The main pane shows either:
//   - "Select a room" placeholder when no room is active
//   - The room's messages + composer when a room is selected

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../context/RoomsContext";
import { useSocket } from "../hooks/useSocket";
import { RoomsSidebar } from "../components/RoomsSidebar";
import type { ChatMessage } from "../types/socket.types";

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedRoom } = useRooms();
  const { socket, isConnected } = useSocket();

  // Messages are stored per room.
  // Key: roomId, Value: array of messages for that room.
  // This lets us preserve messages from rooms the user has visited even
  // when they switch back and forth.
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Effect: when the selected room changes, tell the socket to "join" that
  // room's broadcast group. When we switch away, leave the previous one.
  useEffect(() => {
    if (!socket || !selectedRoom) return;

    const roomId = selectedRoom.id;
    socket.emit("room:join", { roomId }, (response) => {
      if (!response.ok) {
        console.error("Failed to join room:", response.error);
      }
    });

    // Cleanup: when selectedRoom changes OR the component unmounts,
    // leave the previous room.
    return () => {
      socket.emit("room:leave", { roomId });
    };
  }, [socket, selectedRoom]);

  // Effect: subscribe to incoming messages globally.
  // Every message we receive is tagged with its roomId, so we file it
  // into the right room's bucket regardless of which room is currently
  // displayed.
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: ChatMessage) {
      setMessagesByRoom((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] ?? []), message],
      }));
    }

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  // Auto-scroll when messages for the current room change.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesByRoom, selectedRoom]);

  function handleLogout() {
    logout();
    navigate("/");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError(null);

    const content = draft.trim();
    if (content.length === 0 || !selectedRoom) return;
    if (!socket || !isConnected) {
      setSendError("Not connected to the server");
      return;
    }

    socket.emit(
      "message:send",
      { roomId: selectedRoom.id, content },
      (response) => {
        if (response.ok) {
          setDraft("");
        } else {
          setSendError(response.error);
        }
      },
    );
  }

  const currentMessages = selectedRoom ? messagesByRoom[selectedRoom.id] ?? [] : [];

  return (
    <div className="chat-shell">
      <RoomsSidebar />

      <main className="chat-main">
        <header className="chat-header">
          <div>
            <h1>{selectedRoom ? selectedRoom.name : "Chat"}</h1>
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

        {!selectedRoom ? (
          <div className="chat-placeholder">
            <p>Select a room from the sidebar to start chatting.</p>
          </div>
        ) : (
          <>
            <div className="chat-messages">
              {currentMessages.length === 0 ? (
                <p className="chat-empty">No messages yet in #{selectedRoom.name}.</p>
              ) : (
                currentMessages.map((msg) => {
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
              <div ref={messagesEndRef} />
            </div>

            {sendError && <div className="form-error">{sendError}</div>}

            <form className="chat-composer" onSubmit={handleSubmit}>
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={`Message #${selectedRoom.name}…`}
                disabled={!isConnected}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!isConnected || draft.trim().length === 0}
              >
                Send
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

export default Chat;