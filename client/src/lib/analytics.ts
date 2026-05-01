const PLAUSIBLE_DOMAIN = import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() || "";
const PLAUSIBLE_SCRIPT = import.meta.env.VITE_PLAUSIBLE_SCRIPT?.trim() || "https://plausible.io/js/script.js";

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, unknown>; callback?: () => void }) => void;
  }
}

let initialized = false;
let sessionId: string | null = null;

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  if (PLAUSIBLE_DOMAIN && import.meta.env.PROD) {
    const script = document.createElement("script");
    script.defer = true;
    script.dataset.domain = PLAUSIBLE_DOMAIN;
    script.src = PLAUSIBLE_SCRIPT;
    document.head.appendChild(script);

    const stub = document.createElement("script");
    stub.text =
      "window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }";
    document.head.appendChild(stub);
  }
}

function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    const existing = sessionStorage.getItem("calc_session_id");
    if (existing) {
      sessionId = existing;
      return existing;
    }
    const fresh = crypto.randomUUID();
    sessionStorage.setItem("calc_session_id", fresh);
    sessionId = fresh;
    return fresh;
  } catch {
    sessionId = Math.random().toString(36).slice(2);
    return sessionId;
  }
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    /* ignore */
  }
}

export interface ServerEvent {
  calculator: "faraid" | "wasiat" | "zakat" | "salary" | "normal" | "scientific";
  event: string;
  payload?: Record<string, unknown>;
}

export function recordServerEvent({ calculator, event, payload }: ServerEvent): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    calculator,
    event,
    sessionId: getSessionId(),
    locale: typeof document !== "undefined" ? document.documentElement.lang || undefined : undefined,
    path: window.location.hash || window.location.pathname,
    payload,
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/events", blob);
      return;
    }
  } catch {
    /* fall through */
  }

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    /* swallow — analytics must never break UX */
  });
}

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
    const v = params.get(k);
    if (v) utm[k] = v;
  });
  return utm;
}

export { getSessionId };
