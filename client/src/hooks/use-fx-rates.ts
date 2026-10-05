import { useEffect, useState } from "react";
import { FX_API_URL, FX_SNAPSHOT, parseRatesPayload, type RateSnapshot } from "@/lib/currency";

const CACHE_KEY = "fx_rates_v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

export type FxStatus = "loading" | "live" | "fallback";

interface Cached {
  at: number;
  snapshot: RateSnapshot;
}

function readCache(): RateSnapshot | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as Cached;
    if (Date.now() - cached.at > CACHE_TTL_MS) return null;
    return parseRatesPayload({ ...cached.snapshot, base: "USD" });
  } catch {
    return null;
  }
}

/**
 * Live ECB reference rates (via Frankfurter), with a dated bundled snapshot as
 * the fallback so the converter always works — offline, blocked, or API down.
 */
export function useFxRates(): { snapshot: RateSnapshot; status: FxStatus } {
  const [state, setState] = useState<{ snapshot: RateSnapshot; status: FxStatus }>(() => {
    const cached = typeof window !== "undefined" ? readCache() : null;
    return cached ? { snapshot: cached, status: "live" } : { snapshot: FX_SNAPSHOT, status: "loading" };
  });

  useEffect(() => {
    if (state.status === "live") return;
    const ctrl = new AbortController();
    fetch(FX_API_URL, { signal: ctrl.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((payload) => {
        const snapshot = parseRatesPayload(payload);
        if (!snapshot) throw new Error("bad payload");
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), snapshot } satisfies Cached));
        } catch { /* noop */ }
        setState({ snapshot, status: "live" });
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        void err;
        setState({ snapshot: FX_SNAPSHOT, status: "fallback" });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
