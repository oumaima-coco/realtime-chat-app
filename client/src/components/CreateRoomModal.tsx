// CreateRoomModal — a simple modal dialog for creating a new room.
//
// "Modal" = a popup that covers the page, used for focused tasks.
// We implement it with plain CSS (no library) — a fixed-position overlay
// with the form centered on top.

import { useState, type FormEvent } from "react";
import { useRooms } from "../context/RoomsContext";

interface Props {
  onClose: () => void;
}

export function CreateRoomModal({ onClose }: Props) {
  const { createNewRoom } = useRooms();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // The backdrop covers the whole screen. Clicking it closes the modal —
    // a standard UX pattern.
    <div className="modal-backdrop" onClick={onClose}>
      {/*
        stopPropagation on the modal itself prevents clicks INSIDE the
        modal from bubbling up to the backdrop and closing the dialog.
      */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New room</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>
            Room name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. general, random, memes"
              autoFocus
              disabled={isSubmitting}
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="button-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || name.trim().length < 2}>
              {isSubmitting ? "Creating..." : "Create room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function extractErrorMessage(err: unknown): string {
  if (typeof err !== "object" || err === null) return "Failed to create room";
  const e = err as { response?: { data?: { error?: string } } };
  return e.response?.data?.error ?? "Failed to create room";
}