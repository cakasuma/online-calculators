// Single place for the "rates verified" date and official source links shown on
// the salary, EPF and income tax pages. Bump the date only after re-checking
// the rates in malaysianPayroll.ts, incomeTax.ts and epf.ts against the sources.
export const RATES_VERIFIED_DATE = "2026-10-27";

export const RATE_SOURCES = {
  kwsp: { label: "KWSP / EPF", url: "https://www.kwsp.gov.my/en/employer/responsibilities/mandatory-contribution" },
  perkeso: { label: "PERKESO", url: "https://www.perkeso.gov.my/en/our-services/contribution.html" },
  lhdn: { label: "LHDN", url: "https://www.hasil.gov.my/en/individual/individual-life-cycle/how-to-declare-income/tax-rate/" },
} as const;

export type RateSourceKey = keyof typeof RATE_SOURCES;

export function formatVerifiedDate(iso: string, locale: string): string {
  const tag = locale === "ms" ? "ms-MY" : locale === "id" ? "id-ID" : "en-MY";
  return new Intl.DateTimeFormat(tag, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}
