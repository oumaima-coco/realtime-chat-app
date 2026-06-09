// Zod schemas for room endpoints.

import { z } from "zod";

// Schema for POST /rooms (creating a new room).
export const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, "Room name must be at least 2 characters")
    .max(64, "Room name must be at most 64 characters")
    // Allow letters, numbers, spaces, hyphens, underscores.
    .regex(
      /^[a-zA-Z0-9 _-]+$/,
      "Room name can only contain letters, numbers, spaces, underscores, and hyphens",
    ),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;