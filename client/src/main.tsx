import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure the URL hash always contains a locale prefix (e.g. /#/en or /#/id/faraid).
// This enables shareable URLs and browser language auto-detection on first visit.
(function initLocaleHash() {
  const SUPPORTED = ["en", "id"];

  function detectLocale(): string {
    try {
      const saved = localStorage.getItem("calc_locale");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch { /* noop */ }
    const nav = navigator.language?.toLowerCase() || "";
    if (nav.startsWith("id") || nav.startsWith("ms")) return "id";
    return "en";
  }

  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") {
    window.location.hash = "#/" + detectLocale();
    return;
  }
  // Check if existing hash already has a lang prefix
  const path = hash.startsWith("#/") ? hash.slice(2) : hash.slice(1);
  const firstSegment = path.split("/")[0];
  if (!SUPPORTED.includes(firstSegment)) {
    // No lang prefix — prepend detected locale while preserving path
    window.location.hash = "#/" + detectLocale() + (path ? "/" + path : "");
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
