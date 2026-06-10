// Messages API — calls to the backend for loading message history.

import { api } from "./axios";
import type { ChatMessage } from "../types/socket.types";

// The shape the backend returns from GET /rooms/:id/messages.
export interface MessagesPage {
  messages: ChatMessage[];
  hasMore: boolean;
}

// Load a page of messages for a room.
//
// First call: no cursor → returns the 50 newest messages.
// Subsequent calls: pass the createdAt of the oldest message you have
//   → returns 50 messages older than that point.
//
// Backend returns them in oldest-first order (ready to render top-to-bottom).
export async function getRoomMessages(
  roomId: string,
  options: { before?: string; limit?: number } = {},
): Promise<MessagesPage> {
  const params: Record<string, string> = {};
  if (options.before) params.before = options.before;
  if (options.limit) params.limit = String(options.limit);

  const response = await api.get<MessagesPage>(`/rooms/${roomId}/messages`, {
    params,
  });
  return response.data;
}