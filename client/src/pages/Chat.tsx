// Chat page — with database-backed history and pagination.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../context/RoomsContext";
import { useSocket } from "../hooks/useSocket";
import { RoomsSidebar } from "../components/RoomsSidebar";
import { getRoomMessages } from "../api/messages.api";
import type { ChatMessage } from "../types/socket.types";

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedRoom } = useRooms();
  const { socket, isConnected } = useSocket();

  // Per-room state. Keyed by roomId so switching rooms doesn't lose state.
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [hasMoreByRoom, setHasMoreByRoom] = useState<Record<string, boolean>>({});
  const [loadingByRoom, setLoadingByRoom] = useState<Record<string, boolean>>({});

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Track whether the next auto-scroll should happen. After loading older
  // history, we DON'T want to scroll to the bottom — the user is reading older
  // messages. Only auto-scroll on initial load or new live messages.
  const shouldAutoScrollRef = useRef(true);

  // ---- Effect: load initial messages when selectedRoom changes ----
  // This fires when the user picks a different room. We fetch the latest
  // 50 messages from the DB if we don't already have them in state.
  useEffect(() => {
    if (!selectedRoom) return;

    const roomId = selectedRoom.id;
    // Skip if we already loaded this room in this session.
    if (messagesByRoom[roomId] !== undefined) return;

    let cancelled = false;
    setLoadingByRoom((prev) => ({ ...prev, [roomId]: true }));

    getRoomMessages(roomId)
      .then((page) => {
        // The cancelled check handles a race: if the user switches rooms
        // quickly, the response for the previous room might arrive after
        // the new room is selected. We discard the stale response.
        if (cancelled) return;
        setMessagesByRoom((prev) => ({ ...prev, [roomId]: page.messages }));
        setHasMoreByRoom((prev) => ({ ...prev, [roomId]: page.hasMore }));
        shouldAutoScrollRef.current = true;
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingByRoom((prev) => ({ ...prev, [roomId]: false }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoom, messagesByRoom]);

  // ---- Effect: join the socket room when selectedRoom changes ----
  useEffect(() => {
    if (!socket || !selectedRoom) return;

    const roomId = selectedRoom.id;
    socket.emit("room:join", { roomId }, (response) => {
      if (!response.ok) console.error("Failed to join room:", response.error);
    });

    return () => {
      socket.emit("room:leave", { roomId });
    };
  }, [socket, selectedRoom]);

  // ---- Effect: subscribe to incoming messages ----
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: ChatMessage) {
      setMessagesByRoom((prev) => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] ?? []), message],
      }));
      shouldAutoScrollRef.current = true;
    }

    socket.on("message:new", handleNewMessage);
    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket]);

  // ---- Effect: auto-scroll to bottom when appropriate ----
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesByRoom, selectedRoom]);

  // ---- Handlers ----

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

  async function handleLoadMore() {
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;
    const currentMessages = messagesByRoom[roomId] ?? [];
    if (currentMessages.length === 0) return;

    // Cursor = the createdAt of the oldest message we currently have.
    const oldestMessage = currentMessages[0];

    setLoadingByRoom((prev) => ({ ...prev, [roomId]: true }));
    try {
      const page = await getRoomMessages(roomId, {
        before: oldestMessage.createdAt,
      });

      // Prepend older messages at the top. Disable auto-scroll for this update.
      shouldAutoScrollRef.current = false;
      setMessagesByRoom((prev) => ({
        ...prev,
        [roomId]: [...page.messages, ...(prev[roomId] ?? [])],
      }));
      setHasMoreByRoom((prev) => ({ ...prev, [roomId]: page.hasMore }));
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingByRoom((prev) => ({ ...prev, [roomId]: false }));
    }
  }

  // ---- Computed values for rendering ----
  const currentMessages = selectedRoom ? messagesByRoom[selectedRoom.id] ?? [] : [];
  const isLoadingCurrent = selectedRoom ? loadingByRoom[selectedRoom.id] ?? false : false;
  const hasMore = selectedRoom ? hasMoreByRoom[selectedRoom.id] ?? false : false;

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
              {/* "Load more" button — shown only if there's older history. */}
              {hasMore && (
                <button
                  className="load-more-button"
                  onClick={handleLoadMore}
                  disabled={isLoadingCurrent}
                >
                  {isLoadingCurrent ? "Loading…" : "Load older messages"}
                </button>
              )}

              {currentMessages.length === 0 && !isLoadingCurrent ? (
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