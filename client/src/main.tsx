import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure the URL hash always contains a locale prefix (e.g. /#/en or /#/id/faraid).
// Direct path visits such as /salary are normalized to /#/en/salary and preserve query params.
(function initLocaleHash() {
  const SUPPORTED = ["en", "id"];
  const DEFAULT_LOCALE = "en";
  const withSearch = (path: string, search: string) => `#/${path}${search}`;

  function detectLocale(): string {
    try {
      const saved = localStorage.getItem("calc_locale");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch { /* noop */ }
    return DEFAULT_LOCALE;
  }

  const hash = window.location.hash;
  const search = window.location.search || "";
  if (!hash || hash === "#" || hash === "#/") {
    const pathname = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (!pathname) {
      window.location.hash = withSearch(detectLocale(), search);
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    if (SUPPORTED.includes(firstSegment)) {
      window.location.hash = withSearch(segments.join("/"), search);
      return;
    }

    window.location.hash = withSearch(`${DEFAULT_LOCALE}/${segments.join("/")}`, search);
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
