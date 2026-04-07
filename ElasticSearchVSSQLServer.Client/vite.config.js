import path from "path";
import checker from "vite-plugin-checker";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// ----------------------------------------------------------------------

const PORT = 3031;

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    checker({
      eslint: {
        useFlatConfig: true,
        lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
        dev: { logLevel: ["error"] },
      },
      overlay: {
        position: "tl",
        initialIsOpen: false,
      },
    }),
  ],
  optimizeDeps: {
    include: ["@apollo/client"],
  },
  resolve: {
    alias: [
      {
        find: /^src(.+)/,
        replacement: path.resolve(process.cwd(), "src/$1"),
      },
    ],
  },
  server: { port: PORT, host: true },
  preview: { port: PORT, host: true },
});
