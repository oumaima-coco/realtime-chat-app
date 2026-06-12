import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, LogOut, Send, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRooms } from "@/context/RoomsContext";
import { useSocket } from "@/hooks/useSocket";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { RoomsSidebar } from "@/components/RoomsSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getRoomMessages } from "@/api/messages.api";
import type { ChatMessage } from "@/types/socket.types";

interface TypingUser {
  userId: string;
  username: string;
}

function getAvatarColor(username: string): string {
  const colors = ["bg-coral", "bg-sage", "bg-rust", "bg-coralHover"];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) % colors.length;
  }
  return colors[Math.abs(hash)];
}

function getInitials(username: string): string {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

function Chat() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { selectedRoom } = useRooms();
  const { socket, isConnected } = useSocket();

  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>({});
  const [hasMoreByRoom, setHasMoreByRoom] = useState<Record<string, boolean>>({});
  const [loadingByRoom, setLoadingByRoom] = useState<Record<string, boolean>>({});
  const [typingByRoom, setTypingByRoom] = useState<Record<string, TypingUser[]>>({});

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const { handleTyping, stopTyping } = useTypingIndicator(socket, selectedRoom?.id ?? null);

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

  useEffect(() => {
    if (!socket) return;
    function handleTypingStart(payload: { roomId: string; userId: string; username: string }) {
      setTypingByRoom((prev) => {
        const current = prev[payload.roomId] ?? [];
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
    socket.emit("message:send", { roomId: selectedRoom.id, content }, (response) => {
      if (response.ok) {
        setDraft("");
        stopTyping();
      } else {
        setSendError(response.error);
      }
    });
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
    <div className="flex h-screen w-screen bg-cream overflow-hidden">
      <RoomsSidebar />

      <main className="flex-1 flex flex-col min-w-0">

        {/* === HEADER === */}
        <header className="border-b border-border bg-surface px-8 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {selectedRoom ? (
              <>
                <div className="w-12 h-12 rounded-xl bg-coralSoft flex items-center justify-center flex-shrink-0">
                  <Hash className="w-6 h-6 text-coral" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate">{selectedRoom.name}</h1>
                  <p className="text-base text-textMuted flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {selectedRoom.memberCount} {selectedRoom.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
              </>
            ) : (
              <h1 className="text-2xl font-bold">Chat</h1>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-surfaceAlt rounded-full">
                <div className={`w-8 h-8 rounded-full ${getAvatarColor(user.username)} text-white flex items-center justify-center text-sm font-bold`}>
                  {getInitials(user.username)}
                </div>
                <span className="text-base font-semibold">{user.username}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-sage shadow-[0_0_6px_rgba(122,158,122,0.5)]" : "bg-textSoft"}`} />
              </div>
            )}
           <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out" className="h-11 w-11">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* === BODY === */}
        {!selectedRoom ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-coralSoft flex items-center justify-center mb-6">
              <Hash className="w-10 h-10 text-coral" />
            </div>
            <h2 className="text-3xl font-bold mb-3">Select a room</h2>
            <p className="text-textMuted text-lg max-w-md">
              Pick a room from the sidebar to start chatting, or create a new one with the + button.
            </p>
          </div>
        ) : (
          <>
            {/* === MESSAGES — constrained width for readability === */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-8 py-6">
                {hasMore && (
                  <div className="flex justify-center mb-6">
                    <button
                      className="text-base text-textMuted border border-dashed border-borderStrong rounded-full px-6 py-2 hover:bg-surfaceAlt hover:text-text transition-colors bg-transparent shadow-none font-normal disabled:cursor-wait disabled:opacity-60"
                      onClick={handleLoadMore}
                      disabled={isLoadingCurrent}
                    >
                      {isLoadingCurrent ? "Loading…" : "Load older messages"}
                    </button>
                  </div>
                )}

                {currentMessages.length === 0 && !isLoadingCurrent ? (
                  <div className="h-full flex flex-col items-center justify-center text-center pt-20">
                    <div className="w-20 h-20 rounded-2xl bg-coralSoft flex items-center justify-center mb-4">
                      <Hash className="w-10 h-10 text-coral" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Welcome to #{selectedRoom.name}</h3>
                    <p className="text-textMuted text-base">Be the first to say hello.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {currentMessages.map((msg, idx) => {
                      const isMine = msg.senderId === user?.id;
                      const prevMsg = currentMessages[idx - 1];
                      const showHeader = !prevMsg || prevMsg.senderId !== msg.senderId;

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-4 group hover:bg-surfaceAlt/50 px-3 py-1.5 rounded-md ${
                            showHeader ? "mt-4" : ""
                          }`}
                        >
                          <div className="w-11 flex-shrink-0">
                            {showHeader && (
                              <div className={`w-11 h-11 rounded-full ${getAvatarColor(msg.senderUsername)} text-white flex items-center justify-center text-sm font-bold`}>
                                {getInitials(msg.senderUsername)}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {showHeader && (
                              <div className="flex items-baseline gap-2 mb-1">
                                <span className={`text-base font-bold ${isMine ? "text-coral" : "text-text"}`}>
                                  {msg.senderUsername}
                                </span>
                                <span className="text-sm text-textSoft">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            )}
                            <p className="text-base text-text break-words leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* === TYPING INDICATOR === */}
            <div className="max-w-4xl mx-auto w-full px-8 h-7 flex items-center">
              {typingLabel && (
                <div className="flex items-center gap-2 text-sm text-textMuted italic">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1.5 h-1.5 bg-coral rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                  </div>
                  {typingLabel}
                </div>
              )}
            </div>

            {/* === COMPOSER === */}
            <div className="border-t border-border bg-surface px-8 py-5 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                {sendError && (
                  <div className="bg-rustSoft text-rust border border-rust rounded-md px-4 py-2 text-sm font-semibold mb-3">
                    {sendError}
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex gap-3 items-center">
                  <Input
                    type="text"
                    value={draft}
                    onChange={(e) => {
                      setDraft(e.target.value);
                      handleTyping();
                    }}
                    placeholder={`Message #${selectedRoom.name}…`}
                    disabled={!isConnected}
                    autoComplete="off"
                    className="flex-1 h-14 text-base px-5"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!isConnected || draft.trim().length === 0}
                    className="h-14 w-14 flex-shrink-0"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Chat;