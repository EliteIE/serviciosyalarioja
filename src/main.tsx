import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

// Self-hosted Inter variable font (replaces Google Fonts external request)
import "@fontsource-variable/inter";

import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Fire-and-forget — Sentry init is async but we don't want to block paint.
// initSentry() is a no-op when VITE_SENTRY_DSN is unset.
void initSentry();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
