import { describe, it, expect } from "vitest";
import { calculateFixedDeposit, FIXED_DEPOSIT_DEFAULTS } from "../fixedDeposit";

describe("calculateFixedDeposit", () => {
  it("computes simple interest pro-rated to the tenure", () => {
    // RM 10,000 at 3.5% p.a. for 12 months → RM 350 interest.
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 });
    expect(r.interest).toBeCloseTo(350, 6);
    expect(r.maturityValue).toBeCloseTo(10350, 6);
    expect(r.monthlyInterest).toBeCloseTo(350 / 12, 6);
  });

  it("pro-rates a partial-year tenure", () => {
    // RM 20,000 at 3% p.a. for 6 months → 20,000 × 0.03 × 0.5 = RM 300.
    const r = calculateFixedDeposit({ principal: 20000, annualRate: 3, tenureMonths: 6 });
    expect(r.interest).toBeCloseTo(300, 6);
    expect(r.maturityValue).toBeCloseTo(20300, 6);
  });

  it("compounding beats simple interest over a year and is reported", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 12 });
    // (1 + 0.035/12)^12 ≈ 1.035567 → ~RM 355.67 compounded
    expect(r.compoundedMaturityValue).toBeGreaterThan(r.maturityValue);
    expect(r.compoundingBonus).toBeCloseTo(r.compoundedMaturityValue - r.maturityValue, 6);
    expect(r.compoundingBonus).toBeGreaterThan(0);
    expect(r.compoundingBonus).toBeLessThan(10);
  });

  it("compounding bonus is ~zero for a single-month tenure", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 3.5, tenureMonths: 1 });
    expect(r.compoundingBonus).toBeCloseTo(0, 6);
  });

  it("zero rate yields no interest", () => {
    const r = calculateFixedDeposit({ principal: 10000, annualRate: 0, tenureMonths: 12 });
    expect(r.interest).toBe(0);
    expect(r.maturityValue).toBe(10000);
    expect(r.compoundingBonus).toBe(0);
  });

  it("guards against negative inputs", () => {
    const r = calculateFixedDeposit({ principal: -5000, annualRate: -2, tenureMonths: -6 });
    expect(r.principal).toBe(0);
    expect(r.interest).toBe(0);
    expect(r.maturityValue).toBe(0);
    expect(r.monthlyInterest).toBe(0);
  });

  it("ships sane defaults", () => {
    const r = calculateFixedDeposit(FIXED_DEPOSIT_DEFAULTS);
    expect(r.maturityValue).toBeGreaterThan(r.principal);
  });
});
