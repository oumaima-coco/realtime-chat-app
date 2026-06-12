import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases — let us write `import x from "@/lib/utils"` instead of
  // `import x from "../../../lib/utils"`. The `@` maps to the src/ folder.
  // Both vite (here) AND tsconfig.app.json need this alias defined; Vite
  // handles the bundling, tsconfig handles the type checking.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
