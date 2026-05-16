// Tiny helper layer for putting calculator state into the URL so users can
// share specific scenarios. The design is intentionally schema-light: each
// calculator declares an object that maps state keys to URL keys plus a
// parser/serializer pair, and we provide two helpers:
//
//   mergeFromUrl(defaults, schema)  -> read params on mount, return merged state
//   useUrlSync(state, schema, deps) -> debounce-write the state back to ?...
//
// We use history.replaceState so updates do not pollute the browser back-stack.

import { useEffect, useRef } from "react";

export interface UrlField<T, K extends keyof T> {
  /** URL search-param name (kept short for readable links). */
  key: string;
  /** Read a string from the URL and convert to the state value. */
  parse: (raw: string) => T[K] | undefined;
  /** Serialize the state value to a string for the URL, or null to omit. */
  serialize: (value: T[K]) => string | null;
}

export type UrlSchema<T> = {
  [K in keyof T]?: UrlField<T, K>;
};

// ─── Common parsers/serializers ───────────────────────────────────────────────

export const urlStr: UrlField<{ v: string }, "v"> = {
  key: "v",
  parse: (raw) => raw,
  serialize: (v) => (v ? v : null),
};

export function stringField<T, K extends keyof T>(key: string): UrlField<T, K> {
  return {
    key,
    parse: (raw) => raw as T[K],
    serialize: (v) => (v == null || v === "" ? null : String(v)),
  };
}

export function numberField<T, K extends keyof T>(key: string): UrlField<T, K> {
  return {
    key,
    parse: (raw) => {
      const n = Number(raw);
      return (Number.isFinite(n) ? n : undefined) as T[K] | undefined;
    },
    serialize: (v) => {
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n !== 0 ? String(n) : null;
    },
  };
}

export function boolField<T, K extends keyof T>(key: string): UrlField<T, K> {
  return {
    key,
    parse: (raw) => (raw === "1" || raw === "true") as unknown as T[K],
    serialize: (v) => (v ? "1" : null),
  };
}

export function enumField<T, K extends keyof T>(
  key: string,
  allowed: readonly string[],
): UrlField<T, K> {
  return {
    key,
    parse: (raw) => (allowed.includes(raw) ? (raw as unknown as T[K]) : undefined),
    serialize: (v) => (v == null ? null : String(v)),
  };
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function mergeFromUrl<T extends object>(defaults: T, schema: UrlSchema<T>): T {
  if (typeof window === "undefined") return defaults;
  const params = new URLSearchParams(window.location.search);
  const merged: T = { ...defaults };
  let changed = false;
  for (const stateKey of Object.keys(schema) as (keyof T)[]) {
    const field = schema[stateKey];
    if (!field) continue;
    const raw = params.get(field.key);
    if (raw == null) continue;
    try {
      const parsed = field.parse(raw);
      if (parsed !== undefined) {
        merged[stateKey] = parsed as T[typeof stateKey];
        changed = true;
      }
    } catch {
      /* ignore malformed param */
    }
  }
  return changed ? merged : defaults;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Returns true if any URL search param defined in `schema` is currently set.
 * Useful for "did the user arrive via a shared link?" detection.
 */
export function urlHasSchemaParams<T>(schema: UrlSchema<T>): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  for (const stateKey of Object.keys(schema) as (keyof T)[]) {
    const field = schema[stateKey];
    if (field && params.has(field.key)) return true;
  }
  return false;
}

function buildParams<T>(state: T, schema: UrlSchema<T>): URLSearchParams {
  // Start from the existing search so we preserve unrelated params (utm_*, etc.)
  const params = new URLSearchParams(window.location.search);
  for (const stateKey of Object.keys(schema) as (keyof T)[]) {
    const field = schema[stateKey];
    if (!field) continue;
    const value = state[stateKey];
    const serialized = field.serialize(value);
    if (serialized == null) {
      params.delete(field.key);
    } else {
      params.set(field.key, serialized);
    }
  }
  return params;
}

/** Imperatively write the current state to the URL. Used by Share buttons. */
export function syncStateToUrl<T>(state: T, schema: UrlSchema<T>) {
  if (typeof window === "undefined") return;
  const params = buildParams(state, schema);
  const search = params.toString();
  const next = window.location.pathname + (search ? `?${search}` : "") + window.location.hash;
  if (next !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState({}, "", next);
  }
}

/**
 * Hook: whenever `state` changes, debounce-write the serialized params to the
 * URL. We use replaceState so we don't pollute back/forward history.
 */
export function useUrlSync<T>(state: T, schema: UrlSchema<T>, debounceMs = 250) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => syncStateToUrl(state, schema), debounceMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, schema, debounceMs]);
}

/**
 * Build a shareable URL for the given state without mutating the browser URL.
 * Useful for the Share button to construct the canonical link to copy.
 */
export function buildShareUrl<T>(state: T, schema: UrlSchema<T>): string {
  if (typeof window === "undefined") return "";
  const params = buildParams(state, schema);
  const search = params.toString();
  return `${window.location.origin}${window.location.pathname}${search ? `?${search}` : ""}`;
}
