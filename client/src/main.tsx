import { createRoot } from "react-dom/client";
import App from "./App";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from "./lib/i18n";
import "./index.css";

// Normalize the URL so the first path segment is a supported locale.
// Examples:
//   /              -> /en  (or /ms / /id if detected)
//   /salary        -> /en/salary
//   /en/salary     -> unchanged
//   /ms/zakat?x=1  -> unchanged
//   /id/zakat?x=1  -> unchanged
(function initLocalePath() {
  // Source from the shared i18n module so this stays in sync as locales are added.
  const SUPPORTED: readonly string[] = SUPPORTED_LOCALES;

  function detectLocale(): string {
    try {
      const saved = localStorage.getItem("calc_locale");
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {
      /* noop */
    }
    const browserLocale = navigator.language?.toLowerCase() ?? "";
    if (browserLocale.startsWith("ms")) return "ms";
    if (browserLocale.startsWith("id")) return "id";
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
