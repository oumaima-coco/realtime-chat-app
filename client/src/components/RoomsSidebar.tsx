import { useState } from "react";
import { Plus, Hash, Users } from "lucide-react";
import { useRooms } from "@/context/RoomsContext";
import { useAuth } from "@/context/AuthContext";
import { usePresence } from "@/context/PresenceContext";
import { Button } from "@/components/ui/button";
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
    <aside className="w-80 bg-surface border-r border-border flex flex-col h-screen flex-shrink-0">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Hash className="w-6 h-6 text-coral" />
          Rooms
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowCreateModal(true)}
          title="New room"
          aria-label="Create a new room"
          className="h-10 w-10"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {user && (
        <div className="mx-4 mt-4 mb-2 px-4 py-3 bg-sageSoft text-sage rounded-lg flex items-center gap-2.5 text-base font-semibold">
          <span className="w-2.5 h-2.5 bg-sage rounded-full shadow-[0_0_8px_rgba(122,158,122,0.6)]" />
          You are online
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {isLoading && (
          <p className="text-textMuted text-base italic px-3 py-4">Loading rooms…</p>
        )}

        {!isLoading && rooms.length === 0 && (
          <div className="px-3 py-8 text-center">
            <p className="text-textMuted text-base italic">No rooms yet.</p>
            <p className="text-textSoft text-sm mt-1">Click + to create one.</p>
          </div>
        )}

        <ul className="flex flex-col gap-1">
          {rooms.map((room) => {
            const isSelected = selectedRoom?.id === room.id;
            return (
              <li key={room.id}>
                <button
                  onClick={() => handleRoomClick(room.id)}
                  className={`
                    w-full text-left px-3 py-3 rounded-lg flex items-center justify-between gap-2
                    transition-colors group bg-transparent shadow-none text-base
                    ${isSelected
                      ? "bg-coralSoft text-coral font-bold hover:bg-coralSoft"
                      : "text-text font-medium hover:bg-surfaceAlt"
                    }
                  `}
                >
                  <span className="flex items-center gap-2 min-w-0 flex-1">
                    {!room.isMember && (
                      <Plus className="w-4 h-4 flex-shrink-0 text-textMuted" />
                    )}
                    <Hash className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-coral" : "text-textSoft"}`} />
                    <span className="truncate">{room.name}</span>
                  </span>
                  <span className={`
                    flex items-center gap-1 text-sm font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0
                    ${isSelected
                      ? "bg-surface text-coral"
                      : "bg-surfaceAlt text-textSoft"
                    }
                  `}>
                    <Users className="w-3.5 h-3.5" />
                    {room.memberCount}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="p-5 border-t border-border flex items-center gap-2.5 text-base text-textMuted">
        <span className="w-2.5 h-2.5 bg-sage rounded-full shadow-[0_0_6px_rgba(122,158,122,0.5)]" />
        <span>
          <strong className="text-text">{onlineUserIds.size}</strong> online
        </span>
      </div>

      {showCreateModal && (
        <CreateRoomModal onClose={() => setShowCreateModal(false)} />
      )}
    </aside>
  );
}