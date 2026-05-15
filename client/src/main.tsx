import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Normalize the URL so the first path segment is a supported locale.
// Examples:
//   /              -> /en  (or /id if detected)
//   /salary        -> /en/salary
//   /en/salary     -> unchanged
//   /id/zakat?x=1  -> unchanged
(function initLocalePath() {
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

  const pathname = window.location.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (SUPPORTED.includes(firstSegment)) return;

  // Legacy: migrate any old hash-routed URLs (#/en/salary) to path routing.
  const legacyHash = window.location.hash;
  if (legacyHash && legacyHash.startsWith("#/")) {
    const hashPath = legacyHash.slice(1); // /en/salary or /salary
    const hashSegments = hashPath.split("/").filter(Boolean);
    const hashFirst = hashSegments[0];
    const targetLocale = SUPPORTED.includes(hashFirst) ? hashFirst : detectLocale();
    const rest = SUPPORTED.includes(hashFirst) ? hashSegments.slice(1) : hashSegments;
    const newPath = `/${targetLocale}${rest.length ? `/${rest.join("/")}` : ""}`;
    window.history.replaceState({}, "", newPath + window.location.search);
    return;
  }

  const locale = detectLocale();
  const rest = segments.length ? `/${segments.join("/")}` : "";
  window.history.replaceState({}, "", `/${locale}${rest}` + window.location.search);
})();

createRoot(document.getElementById("root")!).render(<App />);
