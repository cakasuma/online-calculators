import { describe, it, expect } from "vitest";
import {
  calculateBmi,
  bmiCategory,
  internationalBmiCategory,
  ADULT_MIN_AGE,
  MOH_CUTOFFS,
  BMI_DEFAULTS,
  type BmiInputs,
} from "../bmi";

const inputs = (o: Partial<BmiInputs> = {}): BmiInputs => ({
  height: 170,
  weight: 70,
  age: 30,
  sex: "male",
  activity: "moderate",
  ...o,
});

describe("bmiCategory (Malaysian MOH cut-offs)", () => {
  it("classifies below 18.5 as underweight", () => {
    expect(bmiCategory(18.4)).toBe("underweight");
  });

  it("classifies 18.5 up to the pre-obesity cut-off as normal", () => {
    expect(bmiCategory(18.5)).toBe("normal");
    expect(bmiCategory(22.9)).toBe("normal");
  });

  it("classifies 23 and above as pre-obese, not normal", () => {
    // The international chart would call this normal.
    expect(bmiCategory(23)).toBe("preObese");
    expect(bmiCategory(24.9)).toBe("preObese");
  });

  it("classifies above 27.5 as obese, not merely overweight", () => {
    // The international chart would call this overweight.
    expect(bmiCategory(27.6)).toBe("obese");
    expect(bmiCategory(29.9)).toBe("obese");
  });

  it("uses the published cut-offs rather than hardcoded numbers", () => {
    expect(MOH_CUTOFFS.preObese).toBe(23);
    expect(MOH_CUTOFFS.obese).toBe(27.5);
    expect(bmiCategory(MOH_CUTOFFS.preObese)).toBe("preObese");
    expect(bmiCategory(MOH_CUTOFFS.obese + 0.1)).toBe("obese");
  });
});

describe("internationalBmiCategory", () => {
  it("keeps the 25 and 30 thresholds for comparison", () => {
    expect(internationalBmiCategory(24.9)).toBe("normal");
    expect(internationalBmiCategory(25)).toBe("overweight");
    expect(internationalBmiCategory(29.9)).toBe("overweight");
    expect(internationalBmiCategory(30)).toBe("obese");
  });

  it("disagrees with the Malaysian guideline in the band between them", () => {
    expect(bmiCategory(24)).toBe("preObese");
    expect(internationalBmiCategory(24)).toBe("normal");
    expect(bmiCategory(28)).toBe("obese");
    expect(internationalBmiCategory(28)).toBe("overweight");
  });
});

describe("calculateBmi", () => {
  it("computes BMI from height and weight", () => {
    // 70 / 1.70^2 = 24.221
    const r = calculateBmi(inputs());
    expect(r.bmi).toBeCloseTo(24.221, 3);
  });

  it("applies the Malaysian guideline to the headline category", () => {
    expect(calculateBmi(inputs()).category).toBe("preObese");
  });

  it("reports what the international chart would have said", () => {
    const r = calculateBmi(inputs());
    expect(r.internationalCategory).toBe("normal");
    expect(r.categoriesDisagree).toBe(true);
  });

  it("reports agreement when both charts give the same answer", () => {
    const r = calculateBmi(inputs({ weight: 55 }));
    expect(r.category).toBe("normal");
    expect(r.internationalCategory).toBe("normal");
    expect(r.categoriesDisagree).toBe(false);
  });

  it("derives the healthy weight range from the Malaysian cut-off", () => {
    const r = calculateBmi(inputs());
    // 18.5 x 1.70^2 = 53.465, and the upper bound stops below 23 rather than 25.
    expect(r.healthyMin).toBeCloseTo(53.465, 3);
    expect(r.healthyMax).toBeCloseTo(MOH_CUTOFFS.preObese * 1.7 * 1.7, 6);
    expect(r.healthyMax).toBeLessThan(67);
  });

  it("computes Mifflin-St Jeor BMR and TDEE", () => {
    const r = calculateBmi(inputs());
    // 10x70 + 6.25x170 - 5x30 + 5 = 1617.5
    expect(r.bmr).toBeCloseTo(1617.5, 6);
    expect(r.tdee).toBeCloseTo(1617.5 * 1.55, 6);
  });

  it("uses the female BMR constant", () => {
    expect(calculateBmi(inputs({ sex: "female" })).bmr).toBeCloseTo(1451.5, 6);
  });

  it("guards against a zero height", () => {
    const r = calculateBmi(inputs({ height: 0 }));
    expect(r.bmi).toBe(0);
    expect(r.healthyMin).toBe(0);
    expect(r.healthyMax).toBe(0);
  });

  it("ships defaults that produce a usable result", () => {
    expect(calculateBmi(BMI_DEFAULTS).bmi).toBeGreaterThan(0);
  });
});

// The Malaysian CPG directs that under-18s be classified with the WHO
// BMI-for-age chart, which needs percentile data this engine does not carry.
describe("children and adolescents", () => {
  it("does not classify anyone under 18", () => {
    const r = calculateBmi(inputs({ age: 12 }));
    expect(r.isAdult).toBe(false);
    expect(r.category).toBeNull();
    expect(r.internationalCategory).toBeNull();
  });

  it("still reports the BMI number itself, which is valid at any age", () => {
    const r = calculateBmi(inputs({ age: 12, height: 150, weight: 45 }));
    expect(r.bmi).toBeCloseTo(20, 6);
  });

  it("treats 18 and over as an adult", () => {
    expect(calculateBmi(inputs({ age: ADULT_MIN_AGE })).isAdult).toBe(true);
    expect(calculateBmi(inputs({ age: ADULT_MIN_AGE })).category).not.toBeNull();
  });

  it("does not claim the charts disagree when neither was applied", () => {
    expect(calculateBmi(inputs({ age: 10 })).categoriesDisagree).toBe(false);
  });

  it("suppresses the healthy weight range for a child", () => {
    // The adult 18.5-23 band is not a valid target for a growing child.
    const r = calculateBmi(inputs({ age: 10 }));
    expect(r.healthyMin).toBe(0);
    expect(r.healthyMax).toBe(0);
  });
});
