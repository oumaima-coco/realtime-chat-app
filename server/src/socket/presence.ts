// Presence tracker — in-memory state of which users are currently online.
//
// Why a Map<userId, Set<socketId>> instead of just Set<userId>?
// Because a single user can have MULTIPLE active connections — open in two
// browser tabs, or on desktop + phone. We track ALL their sockets, and
// only consider them "offline" when the LAST socket disconnects.

class PresenceTracker {
  // userId → set of active socket IDs for that user.
  private socketsByUser = new Map<string, Set<string>>();

  // Register that a new socket connected for this user.
  // Returns true if this is the user's FIRST connection (they were offline).
  // Returns false if they already had other connections (still online).
  addSocket(userId: string, socketId: string): boolean {
    let userSockets = this.socketsByUser.get(userId);
    const wasOffline = !userSockets || userSockets.size === 0;

    if (!userSockets) {
      userSockets = new Set();
      this.socketsByUser.set(userId, userSockets);
    }
    userSockets.add(socketId);

    return wasOffline;
  }

  // Unregister a socket. Returns true if this was the LAST connection
  // (the user is now offline). Returns false if they have other tabs open.
  removeSocket(userId: string, socketId: string): boolean {
    const userSockets = this.socketsByUser.get(userId);
    if (!userSockets) return false;

    userSockets.delete(socketId);
    if (userSockets.size === 0) {
      this.socketsByUser.delete(userId);
      return true;  // user is now fully offline
    }
    return false;  // user still has other tabs/devices connected
  }

  // Get the list of currently online users.
  getOnlineUserIds(): string[] {
    return Array.from(this.socketsByUser.keys());
  }

  // Quick check.
  isOnline(userId: string): boolean {
    return this.socketsByUser.has(userId);
  }
}

// Module-level singleton. All sockets share this one tracker.
export const presence = new PresenceTracker();