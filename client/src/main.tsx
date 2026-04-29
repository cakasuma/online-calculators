import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Ensure the URL hash always contains a locale prefix (e.g. /#/en or /#/id/faraid).
// Direct path visits such as /salary are normalized to /#/en/salary while keeping query params in location.search.
(function initLocaleHash() {
  const SUPPORTED = ["en", "id"];
  const DEFAULT_LOCALE = "en";

  function detectLocale(): string {
    try {
      const saved = localStorage.getItem("calc_locale");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {
      /* noop */
    }

    const browserLocale = navigator.language?.toLowerCase() ?? "";
    if (browserLocale.startsWith("id") || browserLocale.startsWith("ms")) {
      return "id";
    }

    return DEFAULT_LOCALE;
  }

  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") {
    const pathname = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (!pathname) {
      window.location.hash = `#/${detectLocale()}`;
      return;
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    if (SUPPORTED.includes(firstSegment)) {
      window.location.hash = `#/${segments.join("/")}`;
      return;
    }

    window.location.hash = `#/${detectLocale()}/${segments.join("/")}`;
    return;
  }

  // Check if existing hash already has a lang prefix.
  // Keep query params in location.search (outside the hash pathname) for route matching.
  const [hashPath] = hash.split("?");
  const path = hashPath.startsWith("#/") ? hashPath.slice(2) : hashPath.slice(1);
  const firstSegment = path.split("/")[0];
  if (!SUPPORTED.includes(firstSegment)) {
    window.location.hash = `#/${detectLocale()}${path ? `/${path}` : ""}`;
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
