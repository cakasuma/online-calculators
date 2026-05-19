import { track as vercelTrack } from "@vercel/analytics";

let sessionId: string | null = null;

export function initAnalytics(): void {
  // Vercel Web Analytics is mounted via <Analytics /> in App.tsx.
  // Custom events flow through `track()` below. Nothing else to init here.
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

type TrackProps = Record<string, string | number | boolean | null>;

function sanitize(props?: Record<string, unknown>): TrackProps | undefined {
  if (!props) return undefined;
  const out: TrackProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (v === null) out[k] = null;
    else if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") out[k] = v;
    // skip nested objects/arrays — Vercel only accepts flat scalars
  }
  return out;
}

export function track(event: string, props?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    vercelTrack(event, sanitize(props));
  } catch {
    /* analytics must never break UX */
  }
}

export interface ServerEvent {
  calculator: "faraid" | "wasiat" | "zakat" | "salary" | "normal" | "scientific" | "epf";
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
    /* swallow */
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
