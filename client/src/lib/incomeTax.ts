// Malaysia resident individual income tax calculation engine — YA 2026.
//
// Chargeable income is gross income less reliefs, taxed on progressive bands.
// Rebates then come off the tax itself rather than off income, which is why
// zakat is far more valuable than a relief of the same size: RM1 of zakat
// cancels RM1 of tax, while RM1 of relief only saves your marginal rate.
//
// Every statutory figure is a dated constant with a source note, so a Budget
// change is a one-line edit.
//
// Figures were checked against secondary published summaries (L&Co, money.com.my,
// RinggitCalc) in August 2026; the LHDN portal itself was unreachable at the time.
// Where sources disagreed the more widely supported figure was used and the
// conflict noted inline.

/** Resident progressive bands on chargeable income — Malaysia YA 2026. */
export const TAX_BRACKETS = [
  { threshold: 0, rate: 0 },
  { threshold: 5000, rate: 0.01 },
  { threshold: 20000, rate: 0.03 },
  { threshold: 35000, rate: 0.06 },
  { threshold: 50000, rate: 0.11 },
  { threshold: 70000, rate: 0.19 },
  { threshold: 100000, rate: 0.25 },
  { threshold: 400000, rate: 0.26 },
  { threshold: 600000, rate: 0.28 },
  { threshold: 2000000, rate: 0.3 },
];

/**
 * Maximum relief claimable per category, in RM.
 *
 * EPF and life insurance are deliberately separate entries. They are often
 * quoted together as "RM7,000", but the limits are independent: unused life
 * insurance headroom cannot absorb EPF contributions beyond RM4,000.
 */
export const RELIEF_CAPS = {
  personal: 9_000,
  disabledSelf: 7_000,
  spouse: 4_000,
  /** Additional relief on top of the ordinary spouse relief. */
  disabledSpouse: 6_000,
  medical: 10_000,
  parentsMedical: 8_000,
  supportingEquipment: 6_000,
  lifeInsurance: 3_000,
  // One source quoted RM4,000 here against RM3,000 elsewhere; RM3,000 has the
  // wider support and matches the long-standing figure.
  educationMedicalInsurance: 3_000,
  epf: 4_000,
  socsoEis: 350,
  /** Extended from YA 2026 through YA 2030. */
  prs: 3_000,
  /** Raised from RM6,000 for YA 2025–2027. */
  sspn: 8_000,
  educationFees: 7_000,
  lifestyle: 2_500,
  /** Separate from the general lifestyle relief. */
  sports: 1_000,
  childcare: 3_000,
  breastfeeding: 1_000,
  /** Extended to 2027. */
  evCharging: 2_500,
} as const;

/** Child relief by tier, in RM per child. */
export const CHILD_RELIEF = {
  under18: 2_000,
  tertiary: 8_000,
  disabled: 6_000,
  /** Base disabled relief plus the higher-education tier. */
  disabledTertiary: 14_000,
} as const;

/** Rebate granted when chargeable income falls at or below the threshold. */
export const INDIVIDUAL_REBATE = { threshold: 35_000, amount: 400 } as const;

/** Interest relief cap for a first home, by property price band. */
export const HOUSING_LOAN_INTEREST_CAP = {
  upTo500k: 7_000,
  above500k: 5_000,
} as const;

export type HousingLoanBand = keyof typeof HOUSING_LOAN_INTEREST_CAP;

export interface IncomeTaxInputs {
  annualIncome: number;

  disabledSelf: boolean;
  spouse: "yes" | "no";
  disabledSpouse: boolean;
  childrenUnder18: number;
  childrenTertiary: number;
  disabledChildren: number;
  disabledChildrenTertiary: number;

  medical: number;
  parentsMedical: number;
  supportingEquipment: number;
  lifeInsurance: number;
  educationMedicalInsurance: number;

  epf: number;
  socsoEis: number;
  prs: number;
  sspn: number;
  educationFees: number;

  lifestyle: number;
  sports: number;
  childcare: number;
  breastfeeding: number;
  evCharging: number;
  housingLoanInterest: number;
  housingLoanBand: HousingLoanBand;

  /** Zakat paid — a rebate against tax, not a relief against income. */
  zakat: number;
}

/** One claimed relief, with the cap it was measured against. */
export interface ReliefLine {
  key: string;
  claimed: number;
  cap: number;
}

export interface IncomeTaxResult {
  /** Only the reliefs actually claimed, in display order. */
  reliefLines: ReliefLine[];
  totalReliefs: number;
  chargeableIncome: number;
  taxBeforeRebate: number;
  individualRebate: number;
  zakatRebate: number;
  totalRebate: number;
  taxPayable: number;
  effectiveRate: number;
  monthlyPcb: number;
}

/** Tax on a chargeable income, charging each band at its own rate. */
export function progressiveTax(chargeableIncome: number): number {
  const chargeable = Math.max(0, chargeableIncome);
  let tax = 0;
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const current = TAX_BRACKETS[i];
    const upper = TAX_BRACKETS[i + 1]?.threshold ?? Infinity;
    if (chargeable > current.threshold) {
      tax += (Math.min(chargeable, upper) - current.threshold) * current.rate;
    }
  }
  return tax;
}

const capped = (amount: number, cap: number) => Math.min(Math.max(0, amount), cap);
const count = (value: number) => Math.max(0, Math.floor(value));

export function calculateIncomeTax(input: IncomeTaxInputs): IncomeTaxResult {
  const lines: ReliefLine[] = [];
  const add = (key: string, claimed: number, cap: number) => {
    if (claimed > 0) lines.push({ key, claimed, cap });
  };

  add("personal", RELIEF_CAPS.personal, RELIEF_CAPS.personal);

  if (input.disabledSelf) {
    add("disabledSelf", RELIEF_CAPS.disabledSelf, RELIEF_CAPS.disabledSelf);
  }

  // The disabled-spouse relief is additional to the ordinary spouse relief, so
  // it only applies where a spouse is actually claimed.
  if (input.spouse === "yes") {
    const spouseRelief =
      RELIEF_CAPS.spouse + (input.disabledSpouse ? RELIEF_CAPS.disabledSpouse : 0);
    add("spouse", spouseRelief, spouseRelief);
  }

  const childRelief =
    count(input.childrenUnder18) * CHILD_RELIEF.under18 +
    count(input.childrenTertiary) * CHILD_RELIEF.tertiary +
    count(input.disabledChildren) * CHILD_RELIEF.disabled +
    count(input.disabledChildrenTertiary) * CHILD_RELIEF.disabledTertiary;
  add("children", childRelief, childRelief);

  const simple: [string, number, number][] = [
    ["medical", input.medical, RELIEF_CAPS.medical],
    ["parentsMedical", input.parentsMedical, RELIEF_CAPS.parentsMedical],
    ["supportingEquipment", input.supportingEquipment, RELIEF_CAPS.supportingEquipment],
    ["lifeInsurance", input.lifeInsurance, RELIEF_CAPS.lifeInsurance],
    ["educationMedicalInsurance", input.educationMedicalInsurance, RELIEF_CAPS.educationMedicalInsurance],
    ["epf", input.epf, RELIEF_CAPS.epf],
    ["socsoEis", input.socsoEis, RELIEF_CAPS.socsoEis],
    ["prs", input.prs, RELIEF_CAPS.prs],
    ["sspn", input.sspn, RELIEF_CAPS.sspn],
    ["educationFees", input.educationFees, RELIEF_CAPS.educationFees],
    ["lifestyle", input.lifestyle, RELIEF_CAPS.lifestyle],
    ["sports", input.sports, RELIEF_CAPS.sports],
    ["childcare", input.childcare, RELIEF_CAPS.childcare],
    ["breastfeeding", input.breastfeeding, RELIEF_CAPS.breastfeeding],
    ["evCharging", input.evCharging, RELIEF_CAPS.evCharging],
  ];
  for (const [key, amount, cap] of simple) {
    add(key, capped(amount, cap), cap);
  }

  const housingCap = HOUSING_LOAN_INTEREST_CAP[input.housingLoanBand] ?? HOUSING_LOAN_INTEREST_CAP.upTo500k;
  add("housingLoanInterest", capped(input.housingLoanInterest, housingCap), housingCap);

  const totalReliefs = lines.reduce((sum, line) => sum + line.claimed, 0);
  const annualIncome = Math.max(0, input.annualIncome);
  const chargeableIncome = Math.max(0, annualIncome - totalReliefs);
  const taxBeforeRebate = progressiveTax(chargeableIncome);

  const individualRebate =
    chargeableIncome <= INDIVIDUAL_REBATE.threshold
      ? INDIVIDUAL_REBATE.amount * (input.spouse === "yes" ? 2 : 1)
      : 0;

  // Rebates can only cancel tax — neither produces a refund, so zakat is capped
  // at whatever tax is still standing after the individual rebate.
  const afterIndividual = Math.max(0, taxBeforeRebate - individualRebate);
  const zakatRebate = Math.min(Math.max(0, input.zakat), afterIndividual);
  const taxPayable = Math.max(0, afterIndividual - zakatRebate);

  return {
    reliefLines: lines,
    totalReliefs,
    chargeableIncome,
    taxBeforeRebate,
    individualRebate,
    zakatRebate,
    totalRebate: individualRebate + zakatRebate,
    taxPayable,
    effectiveRate: annualIncome > 0 ? (taxPayable / annualIncome) * 100 : 0,
    monthlyPcb: taxPayable / 12,
  };
}

export const INCOME_TAX_DEFAULTS: IncomeTaxInputs = {
  annualIncome: 72000,
  disabledSelf: false,
  spouse: "no",
  disabledSpouse: false,
  childrenUnder18: 0,
  childrenTertiary: 0,
  disabledChildren: 0,
  disabledChildrenTertiary: 0,
  medical: 0,
  parentsMedical: 0,
  supportingEquipment: 0,
  lifeInsurance: 0,
  educationMedicalInsurance: 0,
  epf: 4000,
  socsoEis: 0,
  prs: 0,
  sspn: 0,
  educationFees: 0,
  lifestyle: 2500,
  sports: 0,
  childcare: 0,
  breastfeeding: 0,
  evCharging: 0,
  housingLoanInterest: 0,
  housingLoanBand: "upTo500k",
  zakat: 0,
};
