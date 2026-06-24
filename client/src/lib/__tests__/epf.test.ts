import { describe, it, expect } from "vitest";
import {
  projectEpf,
  basicSavingsTargetAt,
  defaultEmployerRate,
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
