// Input — the universal text input.
// Simpler than Button — no variants needed for typical text inputs.

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-md border-2 border-border bg-surface px-4 py-2 text-base text-text",
          // Placeholder color
          "placeholder:text-textSoft",
          // Focus ring — soft coral glow on focus
          "focus:border-coral focus:outline-none focus:ring-4 focus:ring-coralSoft",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Smooth transitions
          "transition-all",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";