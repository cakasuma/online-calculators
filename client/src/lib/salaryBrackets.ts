// Malaysia income brackets per DOSM Household Income & Expenditure Survey
// 2024 (released 8 October 2025) — the most recent official figures as of
// May 2026. The cutoffs below are the maximum monthly household income at
// the relevant percentile, pulled from:
//   https://storage.dosm.gov.my/hies/hies_malaysia_percentile.csv
//
// 2024 percentile maxima (RM/month, gross household income):
//   P40  →  5,858    (B40 ceiling)
//   P80  → 12,681    (M40 ceiling, T20 floor)
//   P90  → 16,516    (T10 floor)
//   P99  → 40,194    (T1 floor)
//
// The official B40/M40/T20 framework is HOUSEHOLD income, so we caveat that
// clearly in the UI — but it is what Malaysians colloquially compare against,
// and a salary calculator user generally wants to know "how am I doing".

export type IncomeBracket = "B40" | "M40" | "T20" | "T10" | "T1";

export interface BracketInfo {
  key: IncomeBracket;
  /** Lower bound of the bracket in RM/month, inclusive. */
  min: number;
  /** Upper bound in RM/month, inclusive. Infinity for the open top. */
  max: number;
  /** Roughly what % of households fall in this bracket. */
  share: string;
  /** Label key in i18n. */
  labelKey: string;
}

// Note: T10 and T1 are subsets of T20. Compare against the table in order from
// the highest bracket down so the most specific applies first.
export const INCOME_BRACKETS: BracketInfo[] = [
  { key: "B40", min: 0, max: 5858, share: "Bottom 40%", labelKey: "salary.percentile.bracket.B40" },
  { key: "M40", min: 5859, max: 12681, share: "Middle 40%", labelKey: "salary.percentile.bracket.M40" },
  { key: "T20", min: 12682, max: 16516, share: "Top 20%", labelKey: "salary.percentile.bracket.T20" },
  { key: "T10", min: 16517, max: 40194, share: "Top 10%", labelKey: "salary.percentile.bracket.T10" },
  { key: "T1", min: 40195, max: Infinity, share: "Top 1%", labelKey: "salary.percentile.bracket.T1" },
];

/** Data vintage label shown in the UI so users know how fresh the brackets are. */
export const BRACKETS_VINTAGE = "DOSM HIES 2024";

export function bracketForIncome(monthlyIncome: number): BracketInfo {
  // Iterate from richest down so T1 / T10 take precedence over T20.
  for (let i = INCOME_BRACKETS.length - 1; i >= 0; i--) {
    const b = INCOME_BRACKETS[i];
    if (monthlyIncome >= b.min) return b;
  }
  return INCOME_BRACKETS[0];
}
