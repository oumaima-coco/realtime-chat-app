// Chat page — Phase 10: presence + typing indicators.

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRooms } from "../context/RoomsContext";
import { useSocket } from "../hooks/useSocket";
import { useTypingIndicator } from "../hooks/useTypingIndicator";
import { RoomsSidebar } from "../components/RoomsSidebar";
import { getRoomMessages } from "../api/messages.api";
import type { ChatMessage } from "../types/socket.types";

// Shape of a typing user as we track them client-side.
interface TypingUser {
  userId: string;
  username: string;
}

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedRoom } = useRooms();
  const { socket, isConnected } = useSocket();

  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [hasMoreByRoom, setHasMoreByRoom] = useState<Record<string, boolean>>({});
  const [loadingByRoom, setLoadingByRoom] = useState<Record<string, boolean>>({});

  // Per-room map of who's currently typing. Keyed by roomId so switching
  // rooms doesn't lose info about typists in the previous room.
  const [typingByRoom, setTypingByRoom] = useState<Record<string, TypingUser[]>>({});

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  // The debounced typing emit, tied to the current room.
  const { handleTyping, stopTyping } = useTypingIndicator(
    socket,
    selectedRoom?.id ?? null,
  );

  // ---- Load history when switching rooms ----
  useEffect(() => {
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;
    if (messagesByRoom[roomId] !== undefined) return;

    let cancelled = false;
    setLoadingByRoom((prev) => ({ ...prev, [roomId]: true }));

    getRoomMessages(roomId)
      .then((page) => {
        if (cancelled) return;
        setMessagesByRoom((prev) => ({ ...prev, [roomId]: page.messages }));
        setHasMoreByRoom((prev) => ({ ...prev, [roomId]: page.hasMore }));
        shouldAutoScrollRef.current = true;
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => {
        if (!cancelled) setLoadingByRoom((prev) => ({ ...prev, [roomId]: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRoom, messagesByRoom]);

  // ---- Join the socket room ----
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

  // ---- Subscribe to incoming messages ----
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

  // ---- Subscribe to typing events ----
  useEffect(() => {
    if (!socket) return;

    function handleTypingStart(payload: { roomId: string; userId: string; username: string }) {
      setTypingByRoom((prev) => {
        const current = prev[payload.roomId] ?? [];
        // Idempotency: don't duplicate if the user is already in the list.
        if (current.some((u) => u.userId === payload.userId)) return prev;
        return {
          ...prev,
          [payload.roomId]: [...current, { userId: payload.userId, username: payload.username }],
        };
      });
    }

    function handleTypingStop(payload: { roomId: string; userId: string }) {
      setTypingByRoom((prev) => {
        const current = prev[payload.roomId] ?? [];
        const filtered = current.filter((u) => u.userId !== payload.userId);
        // If nothing changed, return prev to avoid unnecessary re-renders.
        if (filtered.length === current.length) return prev;
        return { ...prev, [payload.roomId]: filtered };
      });
    }

    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket]);

  // ---- Auto-scroll ----
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesByRoom, selectedRoom]);

  function handleLogout() {
    stopTyping();
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
          stopTyping();  // Sending implies stop typing.
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

    const oldestMessage = currentMessages[0];

    setLoadingByRoom((prev) => ({ ...prev, [roomId]: true }));
    try {
      const page = await getRoomMessages(roomId, { before: oldestMessage.createdAt });
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

  // Compute the "X is typing..." string for the current room.
  function buildTypingLabel(): string | null {
    if (!selectedRoom) return null;
    const typists = typingByRoom[selectedRoom.id] ?? [];
    if (typists.length === 0) return null;
    if (typists.length === 1) return `${typists[0].username} is typing…`;
    if (typists.length === 2) return `${typists[0].username} and ${typists[1].username} are typing…`;
    return `${typists.length} people are typing…`;
  }

  const currentMessages = selectedRoom ? messagesByRoom[selectedRoom.id] ?? [] : [];
  const isLoadingCurrent = selectedRoom ? loadingByRoom[selectedRoom.id] ?? false : false;
  const hasMore = selectedRoom ? hasMoreByRoom[selectedRoom.id] ?? false : false;
  const typingLabel = buildTypingLabel();

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

            {/* Typing indicator banner. */}
            {typingLabel && (
              <div className="typing-indicator">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span>{typingLabel}</span>
              </div>
            )}

            {sendError && <div className="form-error">{sendError}</div>}

            <form className="chat-composer" onSubmit={handleSubmit}>
              <input
                type="text"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  handleTyping();
                }}
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