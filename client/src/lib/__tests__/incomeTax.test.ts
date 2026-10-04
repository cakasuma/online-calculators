import { describe, it, expect } from "vitest";
import {
  calculateIncomeTax,
  progressiveTax,
  RELIEF_CAPS,
  INCOME_TAX_DEFAULTS,
  type IncomeTaxInputs,
} from "../incomeTax";

const base: IncomeTaxInputs = {
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
  epf: 0,
  socsoEis: 0,
  prs: 0,
  sspn: 0,
  educationFees: 0,
  lifestyle: 0,
  sports: 0,
  childcare: 0,
  breastfeeding: 0,
  evCharging: 0,
  housingLoanInterest: 0,
  housingLoanBand: "upTo500k",
  zakat: 0,
};

const inputs = (o: Partial<IncomeTaxInputs> = {}): IncomeTaxInputs => ({ ...base, ...o });

/** Relief actually allowed for a given line, after its cap. */
const claimed = (r: ReturnType<typeof calculateIncomeTax>, key: string) =>
  r.reliefLines.find((l) => l.key === key)?.claimed ?? 0;

describe("progressiveTax", () => {
  it("charges nothing on the first RM5,000", () => {
    expect(progressiveTax(5000)).toBeCloseTo(0, 6);
  });

  it("matches the published figure at RM35,000", () => {
    // 1% × 15,000 + 3% × 15,000 = 600
    expect(progressiveTax(35000)).toBeCloseTo(600, 6);
  });

  it("matches the published figure at RM50,000", () => {
    expect(progressiveTax(50000)).toBeCloseTo(1500, 6);
  });

  it("matches the published figure at RM70,000", () => {
    expect(progressiveTax(70000)).toBeCloseTo(3700, 6);
  });

  it("matches the published figure at RM100,000", () => {
    expect(progressiveTax(100000)).toBeCloseTo(9400, 6);
  });

  it("matches the published figure at RM400,000", () => {
    expect(progressiveTax(400000)).toBeCloseTo(84400, 6);
  });

  it("never charges tax on a negative chargeable income", () => {
    expect(progressiveTax(-5000)).toBe(0);
  });
});

describe("EPF and life insurance are separately capped", () => {
  it("caps EPF at RM4,000 even with no life insurance", () => {
    // The old combined RM7,000 pool wrongly allowed the full 6,000 here.
    const r = calculateIncomeTax(inputs({ epf: 6000 }));
    expect(claimed(r, "epf")).toBe(RELIEF_CAPS.epf);
    expect(claimed(r, "epf")).toBe(4000);
  });

  it("caps life insurance at RM3,000 independently of EPF", () => {
    const r = calculateIncomeTax(inputs({ lifeInsurance: 5000 }));
    expect(claimed(r, "lifeInsurance")).toBe(3000);
  });

  it("allows the full RM7,000 when both are claimed to their own caps", () => {
    const r = calculateIncomeTax(inputs({ epf: 4000, lifeInsurance: 3000 }));
    expect(claimed(r, "epf") + claimed(r, "lifeInsurance")).toBe(7000);
  });

  it("does not let unused life insurance headroom absorb excess EPF", () => {
    const r = calculateIncomeTax(inputs({ epf: 7000, lifeInsurance: 0 }));
    expect(claimed(r, "epf") + claimed(r, "lifeInsurance")).toBe(4000);
  });
});

describe("child relief tiers", () => {
  it("gives RM2,000 for a child under 18", () => {
    expect(claimed(calculateIncomeTax(inputs({ childrenUnder18: 1 })), "children")).toBe(2000);
  });

  it("gives RM8,000 for a child in tertiary education", () => {
    expect(claimed(calculateIncomeTax(inputs({ childrenTertiary: 1 })), "children")).toBe(8000);
  });

  it("gives RM6,000 for a disabled child", () => {
    expect(claimed(calculateIncomeTax(inputs({ disabledChildren: 1 })), "children")).toBe(6000);
  });

  it("gives RM14,000 for a disabled child in higher education", () => {
    expect(claimed(calculateIncomeTax(inputs({ disabledChildrenTertiary: 1 })), "children")).toBe(14000);
  });

  it("adds up across several children of different tiers", () => {
    const r = calculateIncomeTax(inputs({ childrenUnder18: 2, childrenTertiary: 1 }));
    expect(claimed(r, "children")).toBe(2000 * 2 + 8000);
  });

  it("ignores a negative child count", () => {
    expect(claimed(calculateIncomeTax(inputs({ childrenUnder18: -3 })), "children")).toBe(0);
  });
});

describe("personal and spouse relief", () => {
  it("always grants the RM9,000 personal relief", () => {
    expect(claimed(calculateIncomeTax(inputs()), "personal")).toBe(9000);
  });

  it("adds RM7,000 when the taxpayer is disabled", () => {
    expect(claimed(calculateIncomeTax(inputs({ disabledSelf: true })), "disabledSelf")).toBe(7000);
  });

  it("grants RM4,000 spouse relief", () => {
    expect(claimed(calculateIncomeTax(inputs({ spouse: "yes" })), "spouse")).toBe(4000);
  });

  it("adds a further RM6,000 for a disabled spouse", () => {
    const r = calculateIncomeTax(inputs({ spouse: "yes", disabledSpouse: true }));
    expect(claimed(r, "spouse")).toBe(4000 + 6000);
  });

  it("grants nothing for a disabled spouse when no spouse is claimed", () => {
    expect(claimed(calculateIncomeTax(inputs({ disabledSpouse: true })), "spouse")).toBe(0);
  });
});

describe("relief caps", () => {
  const cases: [keyof IncomeTaxInputs, string, number][] = [
    ["medical", "medical", RELIEF_CAPS.medical],
    ["parentsMedical", "parentsMedical", RELIEF_CAPS.parentsMedical],
    ["supportingEquipment", "supportingEquipment", RELIEF_CAPS.supportingEquipment],
    ["educationMedicalInsurance", "educationMedicalInsurance", RELIEF_CAPS.educationMedicalInsurance],
    ["socsoEis", "socsoEis", RELIEF_CAPS.socsoEis],
    ["prs", "prs", RELIEF_CAPS.prs],
    ["sspn", "sspn", RELIEF_CAPS.sspn],
    ["educationFees", "educationFees", RELIEF_CAPS.educationFees],
    ["lifestyle", "lifestyle", RELIEF_CAPS.lifestyle],
    ["sports", "sports", RELIEF_CAPS.sports],
    ["childcare", "childcare", RELIEF_CAPS.childcare],
    ["breastfeeding", "breastfeeding", RELIEF_CAPS.breastfeeding],
    ["evCharging", "evCharging", RELIEF_CAPS.evCharging],
  ];

  it.each(cases)("caps %s at its published limit", (field, key, cap) => {
    const r = calculateIncomeTax(inputs({ [field]: cap + 5000 } as Partial<IncomeTaxInputs>));
    expect(claimed(r, key)).toBe(cap);
  });

  it.each(cases)("allows an under-cap amount for %s in full", (field, key, cap) => {
    const under = Math.max(0, cap - 100);
    const r = calculateIncomeTax(inputs({ [field]: under } as Partial<IncomeTaxInputs>));
    expect(claimed(r, key)).toBe(under);
  });

  it("reports the cap alongside each claimed amount", () => {
    const r = calculateIncomeTax(inputs({ lifestyle: 9999 }));
    const line = r.reliefLines.find((l) => l.key === "lifestyle");
    expect(line?.cap).toBe(RELIEF_CAPS.lifestyle);
  });
});

describe("first-home loan interest relief", () => {
  it("caps at RM7,000 for a property up to RM500,000", () => {
    const r = calculateIncomeTax(inputs({ housingLoanInterest: 9000, housingLoanBand: "upTo500k" }));
    expect(claimed(r, "housingLoanInterest")).toBe(7000);
  });

  it("caps at RM5,000 for a property above RM500,000", () => {
    const r = calculateIncomeTax(inputs({ housingLoanInterest: 9000, housingLoanBand: "above500k" }));
    expect(claimed(r, "housingLoanInterest")).toBe(5000);
  });
});

describe("rebates", () => {
  it("grants RM400 when chargeable income is at RM35,000", () => {
    // 9,000 personal relief means RM44,000 income lands exactly on RM35,000.
    const r = calculateIncomeTax(inputs({ annualIncome: 44000 }));
    expect(r.chargeableIncome).toBe(35000);
    expect(r.individualRebate).toBe(400);
  });

  it("grants nothing one ringgit above the threshold", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 44001 }));
    expect(r.chargeableIncome).toBe(35001);
    expect(r.individualRebate).toBe(0);
  });

  it("adds a second RM400 when a spouse is claimed", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 44000, spouse: "yes" }));
    expect(r.individualRebate).toBe(800);
  });

  it("cancels tax ringgit for ringgit with zakat", () => {
    const without = calculateIncomeTax(inputs());
    const with_ = calculateIncomeTax(inputs({ zakat: 500 }));
    expect(with_.zakatRebate).toBe(500);
    expect(with_.taxPayable).toBeCloseTo(without.taxPayable - 500, 6);
  });

  it("never refunds more zakat than there is tax to cancel", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 40000, zakat: 99999 }));
    expect(r.taxPayable).toBe(0);
    expect(r.zakatRebate).toBeLessThanOrEqual(r.taxBeforeRebate);
  });

  it("floors tax payable at zero", () => {
    expect(calculateIncomeTax(inputs({ annualIncome: 30000 })).taxPayable).toBe(0);
  });
});

describe("calculateIncomeTax", () => {
  it("subtracts total reliefs from income to reach chargeable income", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 72000, epf: 4000, lifestyle: 2500 }));
    expect(r.totalReliefs).toBe(9000 + 4000 + 2500);
    expect(r.chargeableIncome).toBe(72000 - r.totalReliefs);
  });

  it("never produces a negative chargeable income", () => {
    expect(calculateIncomeTax(inputs({ annualIncome: 1000 })).chargeableIncome).toBe(0);
  });

  it("totals reliefs to the sum of the claimed lines", () => {
    const r = calculateIncomeTax(inputs({ epf: 9999, lifestyle: 9999, sports: 9999, spouse: "yes" }));
    const summed = r.reliefLines.reduce((sum, l) => sum + l.claimed, 0);
    expect(r.totalReliefs).toBeCloseTo(summed, 6);
  });

  it("omits relief lines that were not claimed", () => {
    const r = calculateIncomeTax(inputs());
    expect(r.reliefLines.some((l) => l.key === "sspn")).toBe(false);
    expect(r.reliefLines.some((l) => l.key === "personal")).toBe(true);
  });

  it("spreads tax payable across twelve months", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 120000 }));
    expect(r.monthlyPcb).toBeCloseTo(r.taxPayable / 12, 6);
  });

  it("reports the effective rate against gross income", () => {
    const r = calculateIncomeTax(inputs({ annualIncome: 120000 }));
    expect(r.effectiveRate).toBeCloseTo((r.taxPayable / 120000) * 100, 6);
  });

  it("reports a zero effective rate on zero income", () => {
    expect(calculateIncomeTax(inputs({ annualIncome: 0 })).effectiveRate).toBe(0);
  });

  it("ships defaults that produce a usable result", () => {
    const r = calculateIncomeTax(INCOME_TAX_DEFAULTS);
    expect(r.taxPayable).toBeGreaterThan(0);
  });
});
