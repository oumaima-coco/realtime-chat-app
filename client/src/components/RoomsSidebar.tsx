// RoomsSidebar — the left panel showing rooms list and create button.

import { useState } from "react";
import { useRooms } from "../context/RoomsContext";
import { CreateRoomModal } from "./CreateRoomModal";

export function RoomsSidebar() {
  const { rooms, selectedRoom, isLoading, selectRoom, joinExistingRoom } = useRooms();
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function handleRoomClick(roomId: string) {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    // If user isn't a member yet, join automatically.
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

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </aside>
  );
}