// Typing tracker — tracks who's currently typing in which room.
//
// The CLIENT does the debouncing (waits N seconds of inactivity before
// emitting typing:stop). The SERVER trusts the client's timing but also
// auto-expires typing states after 10 seconds as a safety net — in case
// a client disconnects mid-type without emitting typing:stop.

class TypingTracker {
  // roomId → (userId → expiry timestamp)
  // We use timestamps so we can expire stale entries automatically.
  private byRoom = new Map<string, Map<string, number>>();

  // Safety net: 10 seconds after a typing:start, the entry expires if we
  // haven't heard typing:stop.
  private readonly TIMEOUT_MS = 10_000;

  // Mark a user as typing in a room. Returns true if they weren't already
  // marked as typing (so the caller knows to broadcast typing:start).
  markTyping(roomId: string, userId: string): boolean {
    let room = this.byRoom.get(roomId);
    if (!room) {
      room = new Map();
      this.byRoom.set(roomId, room);
    }
    const wasTyping = room.has(userId);
    room.set(userId, Date.now() + this.TIMEOUT_MS);
    return !wasTyping;
  }

  // Mark a user as no longer typing. Returns true if they WERE typing
  // (so the caller knows to broadcast typing:stop).
  unmarkTyping(roomId: string, userId: string): boolean {
    const room = this.byRoom.get(roomId);
    if (!room) return false;
    const wasTyping = room.has(userId);
    room.delete(userId);
    if (room.size === 0) this.byRoom.delete(roomId);
    return wasTyping;
  }

  // Clear all typing state for a user across all rooms.
  // Called on disconnect — if a user vanishes mid-type, we shouldn't
  // leave "Bob is typing..." showing forever.
  clearAllForUser(userId: string): string[] {
    const affectedRooms: string[] = [];
    for (const [roomId, room] of this.byRoom.entries()) {
      if (room.delete(userId)) {
        affectedRooms.push(roomId);
      }
      if (room.size === 0) this.byRoom.delete(roomId);
    }
    return affectedRooms;
  }
}

export const typing = new TypingTracker();