import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";

// Self-hosted Inter variable font (replaces Google Fonts external request)
import "@fontsource-variable/inter";

import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
