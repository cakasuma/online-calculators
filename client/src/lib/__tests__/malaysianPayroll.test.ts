import { describe, expect, it } from "vitest";
import {
  calculateSalary,
  eisContribution,
  employeeSocso,
  employerSocso,
  skbbkContribution,
  type SalaryCalculationInputs,
} from "../malaysianPayroll";

const base: SalaryCalculationInputs = {
  monthlySalary: 6000,
  annualBonus: 0,
  otherRelief: 0,
  epfRate: 11,
  workerType: "malaysian",
  residentStatus: "resident",
};

describe("PERKESO band table", () => {
  it.each([
    [3000, 14.75, 5.9, 22.5],
    [5000, 24.75, 9.9, 37.5],
    [6000, 29.75, 11.9, 45],
    [10000, 29.75, 11.9, 45],
  ])("RM%i: employee SOCSO %d, EIS %d, SKBBK %d", (wage, socso, eis, skbbk) => {
    expect(employeeSocso(wage)).toBeCloseTo(socso, 2);
    expect(eisContribution(wage)).toBeCloseTo(eis, 2);
    expect(skbbkContribution(wage)).toBeCloseTo(skbbk, 2);
  });

  it("matches the employer ceiling amount of RM104.15", () => {
    expect(employerSocso(6000)).toBeCloseTo(104.15, 2);
  });

  it("uses the band midpoint for wages inside a band", () => {
    expect(employeeSocso(4901)).toBe(24.75);
    expect(employeeSocso(5000)).toBe(24.75);
    expect(employeeSocso(5001)).toBe(25.25);
  });
});

describe("calculateSalary", () => {
  it("RM5,000 matches the PERKESO table", () => {
    const r = calculateSalary({ ...base, monthlySalary: 5000 });
    expect(r.monthlySocso).toBeCloseTo(24.75, 2);
    expect(r.monthlyEis).toBeCloseTo(9.9, 2);
    expect(r.monthlySkbbk).toBeCloseTo(37.5, 2);
    expect(r.monthlyEpf).toBe(550);
  });

  it("applies the RM400 rebate when chargeable income is RM35,000 or less", () => {
    const r = calculateSalary({ ...base, monthlySalary: 3000 });
    // chargeable = 36,000 - 3,960 (EPF) - 247.80 (SOCSO+EIS) - 9,000 = 22,792.20 -> tax ~233 -> rebate -> 0
    expect(r.chargeableIncome).toBeCloseTo(22792.2, 2);
    expect(r.annualIncomeTax).toBe(0);
  });

  it("caps SOCSO/EIS tax relief at RM350 a year", () => {
    const r = calculateSalary(base);
    // 500 paid, 350 relieved: 72,000 - 4,000 - 350 - 9,000
    expect(r.chargeableIncome).toBeCloseTo(58650, 2);
  });

  it("RM6,000 resident", () => {
    const r = calculateSalary(base);
    expect(r.monthlySocso).toBe(29.75);
    expect(r.monthlyEis).toBe(11.9);
    expect(r.monthlySkbbk).toBe(45);
    // tax = 150 + 450 + 900 + 8,650 x 11% = 2,451.50 a year
    expect(r.monthlyTax).toBeCloseTo(2451.5 / 12, 3);
    expect(r.monthlyNet).toBeCloseTo(6000 - 660 - 29.75 - 11.9 - 45 - 2451.5 / 12, 3);
  });

  it("can opt out of SKBBK", () => {
    const r = calculateSalary({ ...base, includeSkbbk: false });
    expect(r.monthlySkbbk).toBe(0);
  });

  it("keeps SOCSO and EIS at their ceiling amounts above RM6,000", () => {
    const r = calculateSalary({ ...base, monthlySalary: 10_000 });
    expect(r.monthlySocso).toBe(29.75);
    expect(r.monthlyEis).toBe(11.9);
    expect(r.monthlySkbbk).toBe(45);
  });

  it("foreign workers: no employee SOCSO/EIS/SKBBK, 2% EPF each side", () => {
    const r = calculateSalary({ ...base, workerType: "foreigner", epfRate: 2 });
    expect(r.monthlySocso).toBe(0);
    expect(r.monthlyEis).toBe(0);
    expect(r.monthlySkbbk).toBe(0);
    expect(r.monthlyEpf).toBe(120);
    expect(r.monthlyEmployerEpf).toBe(120);
    expect(r.monthlyEmployerEis).toBe(0);
    expect(r.monthlyEmployerSocso).toBeCloseTo(74.4, 2); // 1.25% of 5,950, rounded up to 5 sen
  });

  it("employer cost adds 13% EPF up to RM5,000 and 12% above", () => {
    const low = calculateSalary({ ...base, monthlySalary: 5000 });
    const high = calculateSalary({ ...base, monthlySalary: 6000 });
    expect(low.monthlyEmployerEpf).toBe(650);
    expect(high.monthlyEmployerEpf).toBe(720);
    expect(high.monthlyEmployerCost).toBeCloseTo(6000 + 720 + 104.15 + 11.9, 2);
  });
});
