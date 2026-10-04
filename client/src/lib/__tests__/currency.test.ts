import { describe, it, expect } from "vitest";
import {
  CURRENCY_CODES,
  FX_SNAPSHOT,
  convert,
  formatMoney,
  formatRate,
  getRate,
  parseAmount,
  parseRatesPayload,
} from "../currency";
import { CURRENCY_PAIRS, pairParam, pairPath, pairSlug, parsePairParam, buildCurrencyContent, buildCurrencyRoutes } from "../../config/currencyPairs";

const rates = { USD: 1, MYR: 4, SGD: 1.25, JPY: 150 };

describe("convert / getRate", () => {
  it("converts through USD", () => {
    expect(convert(100, rates, "USD", "MYR")).toBeCloseTo(400, 6);
    expect(convert(100, rates, "MYR", "USD")).toBeCloseTo(25, 6);
  });

  it("cross-rates between two non-USD currencies", () => {
    // 1 SGD = 4 / 1.25 MYR = 3.2 MYR
    expect(getRate(rates, "SGD", "MYR")).toBeCloseTo(3.2, 6);
    expect(convert(1000, rates, "SGD", "MYR")).toBeCloseTo(3200, 6);
  });

  it("is consistent in both directions", () => {
    const there = convert(250, rates, "JPY", "MYR");
    expect(convert(there, rates, "MYR", "JPY")).toBeCloseTo(250, 6);
  });

  it("same currency is identity, unknown currency yields 0", () => {
    expect(convert(42, rates, "MYR", "MYR")).toBeCloseTo(42, 9);
    expect(convert(42, rates, "MYR", "XXX")).toBe(0);
    expect(getRate(rates, "MYR", "XXX")).toBeNaN();
  });

  it("guards non-finite amounts", () => {
    expect(convert(NaN, rates, "USD", "MYR")).toBe(0);
  });
});

describe("parseAmount", () => {
  it("handles common formats", () => {
    expect(parseAmount("1000")).toBe(1000);
    expect(parseAmount("1,000.50")).toBe(1000.5);
    expect(parseAmount("1.000,50")).toBe(1000.5);
    expect(parseAmount("1.000.000")).toBe(1000000);
    expect(parseAmount("1,000,000")).toBe(1000000);
    expect(parseAmount("12,5")).toBe(12.5);
  });

  it("returns 0 for junk or negatives", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("-5")).toBe(0);
  });
});

describe("formatting", () => {
  it("uses the currency's decimals and extra precision for tiny values", () => {
    expect(formatMoney(1234.5, "MYR", "en")).toBe("1,234.50 MYR");
    expect(formatMoney(1234.4, "JPY", "en")).toBe("1,234 JPY");
    expect(formatMoney(0.0259, "MYR", "en")).toBe("0.0259 MYR");
  });

  it("formats rates with sensible precision", () => {
    expect(formatRate(4.0845, "en")).toBe("4.0845");
    expect(formatRate(17950, "en")).toBe("17,950.00");
    expect(formatRate(0.00557, "en")).toBe("0.00557");
  });
});

describe("parseRatesPayload", () => {
  const good = { base: "USD", date: "2026-10-02", rates: Object.fromEntries(CURRENCY_CODES.filter((c) => c !== "USD").map((c) => [c, 2])) };

  it("accepts a complete payload and adds USD", () => {
    const snap = parseRatesPayload(good);
    expect(snap?.date).toBe("2026-10-02");
    expect(snap?.rates.USD).toBe(1);
  });

  it("rejects missing, malformed or non-USD-based payloads", () => {
    expect(parseRatesPayload(null)).toBeNull();
    expect(parseRatesPayload({ ...good, date: "yesterday" })).toBeNull();
    expect(parseRatesPayload({ ...good, base: "EUR" })).toBeNull();
    expect(parseRatesPayload({ ...good, rates: { MYR: 4 } })).toBeNull();
    expect(parseRatesPayload({ ...good, rates: { ...good.rates, MYR: -1 } })).toBeNull();
  });
});

describe("snapshot", () => {
  it("covers every supported currency", () => {
    for (const code of CURRENCY_CODES) expect(FX_SNAPSHOT.rates[code]).toBeGreaterThan(0);
  });
});

describe("currency pairs (SEO pages)", () => {
  it("has unique pairs with valid currencies and no self-pairs", () => {
    const keys = CURRENCY_PAIRS.map(([f, t]) => `${f}-${t}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const [f, t] of CURRENCY_PAIRS) {
      expect(f).not.toBe(t);
      expect(CURRENCY_CODES).toContain(f);
      expect(CURRENCY_CODES).toContain(t);
    }
  });

  it("round-trips URL params and builds consistent paths/slugs", () => {
    expect(pairParam("USD", "MYR")).toBe("usd-to-myr");
    expect(pairPath("USD", "MYR")).toBe("/currency-converter/usd-to-myr");
    expect(pairSlug("USD", "MYR")).toBe("fx-usd-myr");
    expect(parsePairParam("usd-to-myr")).toEqual(["USD", "MYR"]);
    expect(parsePairParam("USD-TO-MYR")).toEqual(["USD", "MYR"]);
    expect(parsePairParam("myr-to-myr")).toBeUndefined();
    expect(parsePairParam("xxx-to-yyy")).toBeUndefined();
    expect(parsePairParam(undefined)).toBeUndefined();
  });

  it("emits a route and 3-locale content for every pair, with unique titles", () => {
    const routes = buildCurrencyRoutes();
    const content = buildCurrencyContent();
    expect(routes.length).toBe(CURRENCY_PAIRS.length + 1);
    const titles = new Set<string>();
    for (const route of routes) {
      expect(route.path.startsWith("/currency-converter")).toBe(true);
      for (const loc of ["en", "ms", "id"] as const) {
        const copy = route.copy[loc];
        expect(copy.title.length).toBeGreaterThan(10);
        expect(copy.title.length).toBeLessThanOrEqual(85);
        expect(copy.description.length).toBeLessThanOrEqual(200);
        titles.add(`${loc}|${copy.title}`);
        const c = content[route.slug]?.[loc];
        expect(c, `${route.slug}/${loc}`).toBeDefined();
        expect(c!.faq.length).toBeGreaterThanOrEqual(4);
        expect(JSON.stringify(c)).not.toMatch(/undefined|NaN|\{[A-Z]+\}/);
      }
    }
    expect(titles.size).toBe(routes.length * 3);
  });

  it("puts correct numbers in the copy", () => {
    const en = buildCurrencyContent()["fx-usd-myr"].en;
    expect(en.rateTable!.rows.find((r) => r[0] === "1,000 USD")?.[1]).toBe("4,084.50 MYR");
    expect(en.intro).toContain("1 USD equals 4.0845 MYR");
  });
});
