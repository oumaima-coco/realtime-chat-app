import { useState, useEffect, type FormEvent } from "react";
import { X } from "lucide-react";
import { useRooms } from "@/context/RoomsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  onClose: () => void;
}

const GENERIC_ERROR = "Failed to create room";

function extractErrorMessage(err: unknown): string {
  if (typeof err !== "object" || err === null) return GENERIC_ERROR;
  const e = err as { response?: { data?: { error?: string } } };
  return e.response?.data?.error ?? GENERIC_ERROR;
}

export function CreateRoomModal({ onClose }: Props) {
  const { createNewRoom } = useRooms();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape key — a standard modal UX expectation.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createNewRoom(name);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // Backdrop — covers the entire viewport. Clicks here close the modal.
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in"
      onClick={onClose}
    >
      {/* Modal — clicks INSIDE don't bubble to backdrop. */}
      <div
        className="bg-surface rounded-xl shadow-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close X in top-right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-md hover:bg-surfaceAlt text-textMuted transition-colors bg-transparent shadow-none p-0"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Create a room</h2>
          <p className="text-textMuted text-sm">
            Give it a name. You can invite people to join later.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="general, random, memes…"
              autoFocus
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <div className="bg-rustSoft text-rust border border-rust rounded-md px-4 py-3 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || name.trim().length < 2}
            >
              {isSubmitting ? "Creating..." : "Create room"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}