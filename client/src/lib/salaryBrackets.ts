// Malaysia income brackets per DOSM 2022 Household Income Survey + the
// Household Income & Expenditure 2022 supplementary tables for T10 / T1.
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
  { key: "B40", min: 0, max: 5249, share: "Bottom 40%", labelKey: "salary.percentile.bracket.B40" },
  { key: "M40", min: 5250, max: 11819, share: "Middle 40%", labelKey: "salary.percentile.bracket.M40" },
  { key: "T20", min: 11820, max: 15999, share: "Top 20%", labelKey: "salary.percentile.bracket.T20" },
  { key: "T10", min: 16000, max: 40999, share: "Top 10%", labelKey: "salary.percentile.bracket.T10" },
  { key: "T1", min: 41000, max: Infinity, share: "Top 1%", labelKey: "salary.percentile.bracket.T1" },
];

export function bracketForIncome(monthlyIncome: number): BracketInfo {
  // Iterate from richest down so T1 / T10 take precedence over T20.
  for (let i = INCOME_BRACKETS.length - 1; i >= 0; i--) {
    const b = INCOME_BRACKETS[i];
    if (monthlyIncome >= b.min) return b;
  }
  return INCOME_BRACKETS[0];
}
