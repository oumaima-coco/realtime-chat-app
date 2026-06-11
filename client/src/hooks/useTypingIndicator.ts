// useTypingIndicator — encapsulates the debounced typing-start/stop logic.
//
// Usage:
//   const { handleTyping, stopTyping } = useTypingIndicator(socket, roomId);
//   <input onChange={(e) => { setDraft(e.target.value); handleTyping(); }} />
//
// Behavior:
//   - First call to handleTyping → emit typing:start
//   - Subsequent calls → reset the 3-second silence timer
//   - 3 seconds without a call → emit typing:stop
//   - stopTyping() called explicitly → emit immediately (e.g., after send)

import { useEffect, useRef } from "react";
import type { ChatSocket } from "../api/socket";

const TYPING_TIMEOUT_MS = 3000;

export function useTypingIndicator(socket: ChatSocket | null, roomId: string | null) {
  // We use refs (not state) for two reasons:
  //   1. We don't need re-renders when these change.
  //   2. We need their current value inside callbacks without stale closures.
  const isCurrentlyTypingRef = useRef(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Called whenever the user types a character.
  function handleTyping() {
    if (!socket || !roomId) return;

    // First keystroke: emit typing:start.
    if (!isCurrentlyTypingRef.current) {
      socket.emit("typing:start", { roomId });
      isCurrentlyTypingRef.current = true;
    }

    // Reset the inactivity timer. If the user keeps typing, this keeps
    // canceling and re-scheduling the stop event.
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = setTimeout(() => {
      if (socket && roomId) {
        socket.emit("typing:stop", { roomId });
      }
      isCurrentlyTypingRef.current = false;
      timeoutIdRef.current = null;
    }, TYPING_TIMEOUT_MS);
  }

  // Called when typing should stop immediately — e.g., after sending a
  // message or switching rooms.
  function stopTyping() {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (isCurrentlyTypingRef.current && socket && roomId) {
      socket.emit("typing:stop", { roomId });
      isCurrentlyTypingRef.current = false;
    }
  }

  // Effect: when the roomId changes (user switches rooms), or the
  // component unmounts, stop any pending typing indicator.
  useEffect(() => {
    return () => {
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, socket]);

  return { handleTyping, stopTyping };
}