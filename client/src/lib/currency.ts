// Currency-conversion maths + reference data. Pure (no React, no DOM) so it can
// be shared by the converter page, the SEO config and the Node prerender step.
//
// Rates are held as "units of currency per 1 USD" and cross-rated through USD.
// FX_SNAPSHOT is a dated fallback used for prerendered text and when the live
// rate request fails; refresh it with `npx tsx script/update-fx-rates.ts`.

export type Locale = "en" | "ms" | "id";

export interface CurrencyInfo {
  code: string;
  symbol: string;
  /** Decimal places used when showing amounts of this currency. */
  decimals: number;
  name: Record<Locale, string>;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "MYR", symbol: "RM", decimals: 2, name: { en: "Malaysian Ringgit", ms: "Ringgit Malaysia", id: "Ringgit Malaysia" } },
  { code: "USD", symbol: "$", decimals: 2, name: { en: "US Dollar", ms: "Dolar Amerika Syarikat", id: "Dolar Amerika Serikat" } },
  { code: "SGD", symbol: "S$", decimals: 2, name: { en: "Singapore Dollar", ms: "Dolar Singapura", id: "Dolar Singapura" } },
  { code: "IDR", symbol: "Rp", decimals: 0, name: { en: "Indonesian Rupiah", ms: "Rupiah Indonesia", id: "Rupiah Indonesia" } },
  { code: "EUR", symbol: "€", decimals: 2, name: { en: "Euro", ms: "Euro", id: "Euro" } },
  { code: "GBP", symbol: "£", decimals: 2, name: { en: "British Pound", ms: "Paun Sterling British", id: "Poundsterling Inggris" } },
  { code: "JPY", symbol: "¥", decimals: 0, name: { en: "Japanese Yen", ms: "Yen Jepun", id: "Yen Jepang" } },
  { code: "AUD", symbol: "A$", decimals: 2, name: { en: "Australian Dollar", ms: "Dolar Australia", id: "Dolar Australia" } },
  { code: "CNY", symbol: "CN¥", decimals: 2, name: { en: "Chinese Yuan", ms: "Yuan China", id: "Yuan Tiongkok" } },
  { code: "THB", symbol: "฿", decimals: 2, name: { en: "Thai Baht", ms: "Baht Thailand", id: "Baht Thailand" } },
  { code: "INR", symbol: "₹", decimals: 2, name: { en: "Indian Rupee", ms: "Rupee India", id: "Rupee India" } },
  { code: "KRW", symbol: "₩", decimals: 0, name: { en: "South Korean Won", ms: "Won Korea Selatan", id: "Won Korea Selatan" } },
  { code: "HKD", symbol: "HK$", decimals: 2, name: { en: "Hong Kong Dollar", ms: "Dolar Hong Kong", id: "Dolar Hong Kong" } },
  { code: "CAD", symbol: "C$", decimals: 2, name: { en: "Canadian Dollar", ms: "Dolar Kanada", id: "Dolar Kanada" } },
  { code: "NZD", symbol: "NZ$", decimals: 2, name: { en: "New Zealand Dollar", ms: "Dolar New Zealand", id: "Dolar Selandia Baru" } },
  { code: "PHP", symbol: "₱", decimals: 2, name: { en: "Philippine Peso", ms: "Peso Filipina", id: "Peso Filipina" } },
  { code: "CHF", symbol: "CHF", decimals: 2, name: { en: "Swiss Franc", ms: "Franc Switzerland", id: "Franc Swiss" } },
];

export const CURRENCY_CODES = CURRENCIES.map((c) => c.code);

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function getCurrency(code: string): CurrencyInfo | undefined {
  return BY_CODE.get(code.toUpperCase());
}

export function isCurrencyCode(code: string | null | undefined): code is string {
  return !!code && BY_CODE.has(code.toUpperCase());
}

export type RateTable = Record<string, number>;

export interface RateSnapshot {
  /** ISO date the rates were published for (ECB reference date). */
  date: string;
  /** Units of each currency per 1 USD. */
  rates: RateTable;
}

/** Reference rates from the ECB via Frankfurter, 2026-10-02. */
export const FX_SNAPSHOT: RateSnapshot = {
  date: "2026-10-02",
  rates: {
    MYR: 4.0845,
    USD: 1,
    SGD: 1.2798,
    IDR: 17950,
    EUR: 0.89087,
    GBP: 0.75753,
    JPY: 157.67,
    AUD: 1.4411,
    CNY: 6.7046,
    THB: 33.595,
    INR: 96.32,
    KRW: 1348.28,
    HKD: 7.8471,
    CAD: 1.424,
    NZD: 1.7819,
    PHP: 62.597,
    CHF: 0.82664,
  },
};

export const FX_API_URL = "https://api.frankfurter.dev/v1/latest?base=USD";

/** Rate of 1 `from` expressed in `to`, cross-rated through USD. */
export function getRate(rates: RateTable, from: string, to: string): number {
  const f = rates[from.toUpperCase()];
  const t = rates[to.toUpperCase()];
  if (!f || !t) return NaN;
  return t / f;
}

export function convert(amount: number, rates: RateTable, from: string, to: string): number {
  if (!Number.isFinite(amount)) return 0;
  const rate = getRate(rates, from, to);
  return Number.isFinite(rate) ? amount * rate : 0;
}

/** Validate an untrusted API payload into a usable snapshot, or null. */
export function parseRatesPayload(payload: unknown): RateSnapshot | null {
  if (!payload || typeof payload !== "object") return null;
  const { date, rates, base } = payload as { date?: unknown; rates?: unknown; base?: unknown };
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (base !== undefined && base !== "USD") return null;
  if (!rates || typeof rates !== "object") return null;
  const out: RateTable = { USD: 1 };
  for (const code of CURRENCY_CODES) {
    if (code === "USD") continue;
    const v = (rates as Record<string, unknown>)[code];
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) return null;
    out[code] = v;
  }
  return { date, rates: out };
}

const LOCALE_TAG: Record<Locale, string> = { en: "en-MY", ms: "ms-MY", id: "id-ID" };

export function localeTag(locale: Locale): string {
  return LOCALE_TAG[locale];
}

/** Format a money amount with the currency's code, e.g. "RM 4,084.50". */
export function formatMoney(value: number, code: string, locale: Locale): string {
  const info = getCurrency(code);
  const base = info?.decimals ?? 2;
  const abs = Math.abs(value);
  // Tiny results (e.g. 1 JPY in MYR) need extra precision to be useful.
  const digits = abs > 0 && abs < 1 ? Math.max(base, 4) : base;
  const num = new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
  return `${num} ${code.toUpperCase()}`;
}

/** Format an exchange rate with sensible significant digits. */
export function formatRate(rate: number, locale: Locale): string {
  if (!Number.isFinite(rate)) return "—";
  const digits = rate >= 1000 ? 2 : rate >= 1 ? 4 : rate >= 0.01 ? 5 : 6;
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    minimumFractionDigits: Math.min(digits, 2),
    maximumFractionDigits: digits,
  }).format(rate);
}

/** Forgiving number parser: handles "1,000.50", "1.000,50" and "1000". */
export function parseAmount(value: string): number {
  let s = value.replace(/[\s_]/g, "");
  if (!s) return 0;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    // Whichever separator comes last is the decimal mark.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const parts = s.split(",");
    s = parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2 ? `${parts[0]}.${parts[1]}` : s.replace(/,/g, "");
  } else if (lastDot !== -1) {
    const parts = s.split(".");
    // "1.000.000" is thousands grouping, "1.5" is a decimal.
    if (parts.length > 2) s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Amounts shown in the "quick conversion" tables. */
export const QUICK_AMOUNTS = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000];
