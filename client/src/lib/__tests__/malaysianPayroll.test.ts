import { describe, expect, it } from "vitest";
import { calculateSalary } from "../malaysianPayroll";

describe("calculateSalary", () => {
  it("uses the PERKESO ceiling-band employee contributions at RM6,000", () => {
    const result = calculateSalary({
      monthlySalary: 6000,
      annualBonus: 0,
      otherRelief: 0,
      epfRate: 11,
      workerType: "malaysian",
      residentStatus: "resident",
    });

    expect(result.monthlySocso).toBe(29.75);
    expect(result.monthlyEis).toBe(11.9);
    expect(result.monthlyTax).toBeCloseTo(202.9185, 3);
    expect(result.monthlyNet).toBeCloseTo(5095.4315, 3);
  });

  it("keeps SOCSO and EIS at their ceiling amounts above RM6,000", () => {
    const result = calculateSalary({
      monthlySalary: 10_000,
      annualBonus: 0,
      otherRelief: 0,
      epfRate: 11,
      workerType: "malaysian",
      residentStatus: "resident",
    });

    expect(result.monthlySocso).toBe(29.75);
    expect(result.monthlyEis).toBe(11.9);
  });

  it("does not apply employee SOCSO or EIS to foreign workers", () => {
    const result = calculateSalary({
      monthlySalary: 6000,
      annualBonus: 0,
      otherRelief: 0,
      epfRate: 11,
      workerType: "foreigner",
      residentStatus: "resident",
    });

    expect(result.monthlySocso).toBe(0);
    expect(result.monthlyEis).toBe(0);
  });
});
