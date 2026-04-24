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
    chunkSizeWarningLimit: 800,
    sourcemap: mode === "development" ? true : "hidden",
    // NOTE: rollupOptions.output.manualChunks removed intentionally.
    // A hand-rolled vendor split (react-vendor, radix, charts, supabase,
    // forms, dates, icons, ui-extras) repeatedly produced white-screen
    // TDZ / "Cannot read properties of undefined (reading 'forwardRef')"
    // errors in production because Rollup emitted modules whose top-level
    // code dereferenced exports from chunks that weren't fully initialized
    // yet. Recharts' internal circular imports and Radix's shared React
    // dereferences are especially sensitive. Letting Vite/Rollup chunk
    // automatically produces slightly different vendor boundaries but
    // guarantees correct init order. Route code splitting is still done
    // per-file via React.lazy() in src/App.tsx.
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
}));
