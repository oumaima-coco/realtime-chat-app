// cn() — the helper every shadcn component imports.
// Combines clsx (conditional class names) with twMerge (Tailwind conflict
// resolution) so you can write things like:
//   cn("p-4 bg-red", isHover && "bg-blue", className)
// and get a clean string with conflicts properly resolved.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}