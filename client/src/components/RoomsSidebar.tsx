// RoomsSidebar — now shows online indicators on room counts.
// The full "members list with green dots per user" UI will come in a
// future iteration; for now we show "X online" next to "Y members".

import { useState } from "react";
import { useRooms } from "../context/RoomsContext";
import { useAuth } from "../context/AuthContext";
import { usePresence } from "../context/PresenceContext";
import { CreateRoomModal } from "./CreateRoomModal";

export function RoomsSidebar() {
  const { rooms, selectedRoom, isLoading, selectRoom, joinExistingRoom } = useRooms();
  const { user } = useAuth();
  const { onlineUserIds } = usePresence();
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function handleRoomClick(roomId: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    if (!room.isMember) {
      await joinExistingRoom(roomId);
    } else {
      selectRoom(room);
    }
  }

  return (
    <aside className="rooms-sidebar">
      <div className="rooms-sidebar-header">
        <h2>Rooms</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="button-icon"
          title="New room"
        >
          +
        </button>
      </div>

      {/* Show the current user's online status indicator at the top. */}
      {user && (
        <div className="sidebar-self">
          <span className="online-dot" />
          <span>You are online</span>
        </div>
      )}

      {isLoading && <p className="rooms-loading">Loading...</p>}

      {!isLoading && rooms.length === 0 && (
        <p className="rooms-empty">No rooms yet. Create one!</p>
      )}

      <ul className="rooms-list">
        {rooms.map((room) => {
          const isSelected = selectedRoom?.id === room.id;
          return (
            <li key={room.id}>
              <button
                onClick={() => handleRoomClick(room.id)}
                className={`room-item ${isSelected ? "room-item--selected" : ""}`}
              >
                <span className="room-item-name">
                  {room.isMember ? "" : "+ "}
                  {room.name}
                </span>
                <span className="room-item-count">{room.memberCount}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Total online users counter at the bottom of the sidebar. */}
      <div className="sidebar-footer">
        <span className="online-dot" />
        <span>{onlineUserIds.size} online</span>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </aside>
  );
}