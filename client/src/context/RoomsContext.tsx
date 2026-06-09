// RoomsContext — global rooms state.
//
// Responsibilities:
//   - Holds the list of all rooms (refreshed from the server)
//   - Tracks the currently selected room (the one the user is viewing)
//   - Provides actions: loadRooms, createNewRoom, joinExistingRoom, selectRoom
//
// Why a context? Multiple components need this state:
//   - Sidebar shows the list and the "+ New room" button
//   - Main chat pane displays messages for the selected room
//   - Future presence indicators may show members per room
// Lifting state to a shared context is the React way to share without prop drilling.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as roomsApi from "../api/rooms.api";
import type { Room } from "../api/rooms.api";
import { useAuth } from "./AuthContext";

interface RoomsContextValue {
  rooms: Room[];
  selectedRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  loadRooms: () => Promise<void>;
  createNewRoom: (name: string) => Promise<Room>;
  joinExistingRoom: (roomId: string) => Promise<void>;
  selectRoom: (room: Room | null) => void;
}

const RoomsContext = createContext<RoomsContextValue | undefined>(undefined);

export function RoomsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load rooms from the server. Wrapped in useCallback so its identity
  // is stable across renders — important because we'll reference it in
  // useEffect dependency arrays.
  const loadRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await roomsApi.listRooms();
      setRooms(fetched);
    } catch (err) {
      setError("Failed to load rooms");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // When the user logs in, load their rooms automatically.
  // When they log out (user becomes null), clear the state.
  useEffect(() => {
    if (user) {
      loadRooms();
    } else {
      setRooms([]);
      setSelectedRoom(null);
    }
  }, [user, loadRooms]);

  // Create a new room. The backend auto-joins the creator as a member.
  // After creating, we add the new room to local state without re-fetching
  // everything (small optimization for snappy UX).
  async function createNewRoom(name: string): Promise<Room> {
    const newRoom = await roomsApi.createRoom(name);
    setRooms((prev) => [newRoom, ...prev]);
    // Auto-select the new room — most users immediately want to use what
    // they just created.
    setSelectedRoom(newRoom);
    return newRoom;
  }

  // Join an existing room. After joining, refresh the list so the
  // isMember/memberCount fields are accurate.
  async function joinExistingRoom(roomId: string): Promise<void> {
    await roomsApi.joinRoom(roomId);
    await loadRooms();
    // Find and select the joined room.
    const target = rooms.find((r) => r.id === roomId);
    if (target) {
      setSelectedRoom({ ...target, isMember: true });
    }
  }

  // Just switch which room is "active" in the UI. No server call.
  function selectRoom(room: Room | null) {
    setSelectedRoom(room);
  }

  return (
    <RoomsContext.Provider
      value={{
        rooms,
        selectedRoom,
        isLoading,
        error,
        loadRooms,
        createNewRoom,
        joinExistingRoom,
        selectRoom,
      }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export function useRooms(): RoomsContextValue {
  const context = useContext(RoomsContext);
  if (context === undefined) {
    throw new Error("useRooms must be used within a RoomsProvider");
  }
  return context;
}