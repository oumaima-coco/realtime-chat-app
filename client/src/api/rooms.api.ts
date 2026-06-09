// Rooms API — thin wrappers around the backend's /rooms endpoints.

import { api } from "./axios";

// Shape returned by the backend. Mirrors PublicRoom in rooms.service.ts.
export interface Room {
  id: string;
  name: string;
  createdBy: string | null;
  createdAt: string;
  memberCount: number;
  isMember: boolean;
}

// GET /rooms — list all rooms.
export async function listRooms(): Promise<Room[]> {
  const response = await api.get<{ rooms: Room[] }>("/rooms");
  return response.data.rooms;
}

// POST /rooms — create a new room.
export async function createRoom(name: string): Promise<Room> {
  const response = await api.post<{ room: Room }>("/rooms", { name });
  return response.data.room;
}

// POST /rooms/:id/join — add the current user as a member.
// Returns 204 with no body, so we don't need to read response.data.
export async function joinRoom(roomId: string): Promise<void> {
  await api.post(`/rooms/${roomId}/join`);
}

// POST /rooms/:id/leave — remove the current user as a member.
export async function leaveRoom(roomId: string): Promise<void> {
  await api.post(`/rooms/${roomId}/leave`);
}