// Button — the universal button component.
//
// This file uses a pattern called "compound variants" via cva
// (class-variance-authority). The Button has multiple INDEPENDENT
// dimensions of variation:
//   - variant: visual style (primary, ghost, destructive...)
//   - size:    physical size (sm, md, lg, icon)
// Each combination produces a different set of Tailwind classes.

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// cva() defines a "variant function." We give it:
//   1. Base classes (always applied)
//   2. variants: an object mapping variant names to class strings
//   3. defaultVariants: what to apply when no variant is specified
//
// Calling buttonVariants({ variant: "ghost", size: "sm" }) returns a
// single class string that combines the base + the right variants.
const buttonVariants = cva(
  // Base classes — always present on every Button.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Primary: solid coral, the "main action" button.
        default:
          "bg-coral text-white shadow-sm hover:bg-coralHover hover:-translate-y-px hover:shadow-md active:translate-y-0",

        // Secondary: ghost button with a thin border, for less-important actions.
        secondary:
          "bg-transparent text-textMuted border-2 border-borderStrong hover:bg-surfaceAlt hover:text-text hover:-translate-y-px",

        // Destructive: rust red, for delete/leave actions.
        destructive:
          "bg-rust text-white shadow-sm hover:bg-rust/90 hover:-translate-y-px",

        // Ghost: no background until hover. Used for icon buttons.
        ghost:
          "bg-transparent text-text hover:bg-surfaceAlt",

        // Link: looks like a hyperlink.
        link:
          "bg-transparent text-coral underline-offset-4 hover:underline shadow-none",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-5 text-base",
        lg: "h-12 px-6 text-lg",
        // Icon: square, just enough room for an icon.
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

// The Props type combines:
//   - All standard <button> HTML attributes (onClick, type, disabled...)
//   - The variant props extracted from buttonVariants
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// forwardRef is used so parents can attach refs to the underlying <button>.
// shadcn ships every component with forwardRef as a defensive default —
// some libraries (modal focus management, autoFocus, etc.) need it.
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

// Export the variants function in case someone needs to compose the styles
// onto a different element (e.g., a Link styled to look like a button).
export { buttonVariants };