import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    sourcemap: mode === "development" ? true : "hidden",
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep node_modules split by logical vendor groups
          if (id.includes("node_modules")) {
            if (id.includes("react-dom") || id.includes("react-router") || /[\\/]react[\\/]/.test(id)) {
              return "react-vendor";
            }
            if (id.includes("@supabase")) {
              return "supabase";
            }
            if (id.includes("@radix-ui")) {
              return "radix";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "charts";
            }
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "forms";
            }
            if (id.includes("date-fns") || id.includes("react-day-picker")) {
              return "dates";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
            if (
              id.includes("embla-carousel") ||
              id.includes("react-resizable-panels") ||
              id.includes("input-otp") ||
              id.includes("vaul") ||
              id.includes("cmdk") ||
              id.includes("sonner")
            ) {
              return "ui-extras";
            }
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
}));
