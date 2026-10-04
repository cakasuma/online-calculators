import { describe, it, expect } from "vitest";
import {
  projectEpf,
  basicSavingsTargetAt,
  basicSavingsAt60,
  defaultEmployerRate,
  statutoryRates,
  EPF_DEFAULTS,
} from "../epf";

describe("defaultEmployerRate", () => {
  it("is 13% at or below RM 5,000 and 12% above", () => {
    expect(defaultEmployerRate(3000)).toBe(13);
    expect(defaultEmployerRate(5000)).toBe(13);
    expect(defaultEmployerRate(5000.01)).toBe(12);
    expect(defaultEmployerRate(8000)).toBe(12);
  });
});

describe("basicSavingsTargetAt", () => {
  it("returns the published milestone amounts exactly", () => {
    expect(basicSavingsTargetAt(18)).toBe(0);
    expect(basicSavingsTargetAt(30)).toBe(38000);
    expect(basicSavingsTargetAt(55)).toBe(294000);
    expect(basicSavingsTargetAt(60)).toBe(390000);
  });

  it("clamps below the first and above the last milestone", () => {
    expect(basicSavingsTargetAt(10)).toBe(0);
    expect(basicSavingsTargetAt(70)).toBe(390000);
  });

  it("interpolates linearly between milestones", () => {
    // Between age 30 (38,000) and 35 (67,000): age 32 → 38,000 + (2/5)×29,000
    expect(basicSavingsTargetAt(32)).toBe(49600);
  });
});

describe("projectEpf", () => {
  it("compounds a deterministic single year with no growth or dividend", () => {
    const p = projectEpf({
      currentAge: 30,
      retirementAge: 31,
      currentBalance: 0,
      monthlySalary: 5000,
      salaryGrowthRate: 0,
      dividendRate: 0,
      employeeRate: 11,
      voluntaryAnnual: 0,
      bonusMonths: 0,
    });
    // 5000 × (11% + 13%) × 12 = 14,400
    expect(p.years).toHaveLength(1);
    expect(p.totalContributions).toBeCloseTo(14400, 6);
    expect(p.totalDividends).toBe(0);
    expect(p.finalBalance).toBeCloseTo(14400, 6);
  });

  it("credits dividends so the balance exceeds contributions", () => {
    const p = projectEpf({ ...EPF_DEFAULTS });
    expect(p.years.length).toBe(EPF_DEFAULTS.retirementAge - EPF_DEFAULTS.currentAge);
    expect(p.totalDividends).toBeGreaterThan(0);
    expect(p.finalBalance).toBeGreaterThan(p.totalContributions);
  });

  it("derives monthly retirement income from a 4% safe-withdrawal rate", () => {
    const p = projectEpf({ ...EPF_DEFAULTS });
    expect(p.monthlyRetirementIncome).toBeCloseTo((p.finalBalance * 0.04) / 12, 6);
  });

  it("reports whether the projection meets the basic savings target", () => {
    const p = projectEpf({ ...EPF_DEFAULTS });
    expect(p.basicSavingsTarget).toBe(basicSavingsTargetAt(EPF_DEFAULTS.retirementAge));
    expect(p.meetsTarget).toBe(p.finalBalance >= p.basicSavingsTarget);
  });
});

// ─── Account restructuring and the RIA framework ──────────────────────────────

describe("statutoryRates", () => {
  it("gives a Malaysian under 60 the Schedule III rates", () => {
    expect(statutoryRates(4000, 35, "citizen")).toEqual({ employee: 11, employer: 13 });
    expect(statutoryRates(8000, 35, "citizen")).toEqual({ employee: 11, employer: 12 });
  });

  it("drops the employee rate to zero and the employer rate to 4% from age 60", () => {
    expect(statutoryRates(8000, 60, "citizen")).toEqual({ employee: 0, employer: 4 });
    expect(statutoryRates(4000, 65, "citizen")).toEqual({ employee: 0, employer: 4 });
  });

  it("charges a non-citizen under 60 the mandatory 2% each way", () => {
    expect(statutoryRates(8000, 35, "foreigner")).toEqual({ employee: 2, employer: 2 });
  });

  it("moves a non-citizen aged 60 or over onto the same 4% employer rate", () => {
    expect(statutoryRates(8000, 62, "foreigner")).toEqual({ employee: 0, employer: 4 });
  });

  it("stops contributions entirely from age 75", () => {
    expect(statutoryRates(8000, 75, "citizen")).toEqual({ employee: 0, employer: 0 });
    expect(statutoryRates(8000, 80, "foreigner")).toEqual({ employee: 0, employer: 0 });
  });
});

describe("basicSavingsAt60", () => {
  it("follows the published phase-in", () => {
    expect(basicSavingsAt60(2026)).toBe(290000);
    expect(basicSavingsAt60(2027)).toBe(340000);
    expect(basicSavingsAt60(2028)).toBe(390000);
  });

  it("holds the final figure for later years", () => {
    expect(basicSavingsAt60(2040)).toBe(390000);
  });

  it("holds the first published figure for earlier years", () => {
    expect(basicSavingsAt60(2020)).toBe(290000);
  });
});

describe("basicSavingsTargetAt with a retirement year", () => {
  it("keeps the full curve when no year is given", () => {
    expect(basicSavingsTargetAt(60)).toBe(390000);
    expect(basicSavingsTargetAt(30)).toBe(38000);
  });

  it("scales the curve down for someone turning 60 in 2026", () => {
    expect(basicSavingsTargetAt(60, 2026)).toBe(290000);
    // The whole curve scales by the same 290/390 factor.
    expect(basicSavingsTargetAt(30, 2026)).toBe(Math.round(38000 * (290000 / 390000)));
  });

  it("is unscaled once the phase-in completes", () => {
    expect(basicSavingsTargetAt(45, 2028)).toBe(basicSavingsTargetAt(45));
  });
});

describe("account restructuring", () => {
  const under55 = {
    ...EPF_DEFAULTS,
    currentAge: 30,
    retirementAge: 40,
    currentBalance: 0,
    bonusMonths: 0,
    voluntaryAnnual: 0,
  };

  it("splits new contributions 75/15/10 across the three accounts", () => {
    const p = projectEpf(under55);
    const a = p.accounts!;
    expect(a.persaraan / p.finalBalance).toBeCloseTo(0.75, 6);
    expect(a.sejahtera / p.finalBalance).toBeCloseTo(0.15, 6);
    expect(a.fleksibel / p.finalBalance).toBeCloseTo(0.1, 6);
  });

  it("has the three accounts add back up to the final balance", () => {
    const p = projectEpf(under55);
    const a = p.accounts!;
    expect(a.persaraan + a.sejahtera + a.fleksibel).toBeCloseTo(p.finalBalance, 4);
  });

  it("keeps an existing balance in Akaun Persaraan, raising its share", () => {
    const p = projectEpf({ ...under55, currentBalance: 100000 });
    const a = p.accounts!;
    expect(a.persaraan / p.finalBalance).toBeGreaterThan(0.75);
  });

  it("consolidates the accounts once the member reaches 55", () => {
    const p = projectEpf({ ...EPF_DEFAULTS, currentAge: 50, retirementAge: 60 });
    expect(p.consolidatedAt55).toBe(true);
    expect(p.accounts).toBeNull();
  });

  it("keeps the split for a projection ending before 55", () => {
    const p = projectEpf(under55);
    expect(p.consolidatedAt55).toBe(false);
    expect(p.accounts).not.toBeNull();
  });
});

describe("RIA tiers", () => {
  it("exposes the three published tiers", () => {
    const p = projectEpf({ ...EPF_DEFAULTS });
    expect(p.riaTiers).toEqual({ basic: 390000, adequate: 650000, enhanced: 1300000 });
  });

  it("reports the highest tier the projection reaches", () => {
    const poor = projectEpf({ ...EPF_DEFAULTS, currentBalance: 0, monthlySalary: 1500, dividendRate: 0, salaryGrowthRate: 0 });
    expect(poor.tierReached).toBe("none");
    const rich = projectEpf({ ...EPF_DEFAULTS, currentBalance: 2000000 });
    expect(rich.tierReached).toBe("enhanced");
  });
});

describe("contribution rates through the projection", () => {
  it("stops employee contributions once the member is 60 for a full year", () => {
    const p = projectEpf({ ...EPF_DEFAULTS, currentAge: 60, retirementAge: 63, salaryGrowthRate: 0 });
    // Every projected year is spent at 60 or above.
    for (const year of p.years) {
      expect(year.employeeMonthly).toBe(0);
      expect(year.employerMonthly).toBeCloseTo(year.monthlySalary * 0.04, 6);
    }
  });

  it("contributes far less for a non-citizen on the 2% schedule", () => {
    const citizen = projectEpf({ ...EPF_DEFAULTS, workerType: "citizen" });
    const foreign = projectEpf({ ...EPF_DEFAULTS, workerType: "foreigner" });
    expect(foreign.totalContributions).toBeLessThan(citizen.totalContributions / 4);
  });
});
