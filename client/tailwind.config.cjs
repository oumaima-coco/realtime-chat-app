/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        cream:        "var(--color-bg)",
        surface:      "var(--color-surface)",
        surfaceAlt:   "var(--color-surface-alt)",
        border:       "var(--color-border)",
        borderStrong: "var(--color-border-strong)",
        text:         "var(--color-text)",
        textMuted:    "var(--color-text-muted)",
        textSoft:     "var(--color-text-soft)",
        coral:        "var(--color-accent)",
        coralHover:   "var(--color-accent-hover)",
        coralSoft:    "var(--color-accent-soft)",
        sage:         "var(--color-success)",
        sageSoft:     "var(--color-success-soft)",
        rust:         "var(--color-error)",
        rustSoft:     "var(--color-error-soft)",
      },

      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
      },

      borderRadius: {
        DEFAULT: "var(--radius-md)",
        sm:      "var(--radius-sm)",
        md:      "var(--radius-md)",
        lg:      "var(--radius-lg)",
        xl:      "var(--radius-xl)",
        full:    "var(--radius-full)",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },

  plugins: [],
};