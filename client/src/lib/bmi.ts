// BMI, BMR and daily energy calculation engine, using Malaysian clinical cut-offs.
//
// The BMI thresholds most calculators use — overweight at 25, obese at 30 — come
// from a Caucasian reference population. Asians carry meaningfully more body fat
// at the same BMI and develop diabetes and cardiovascular disease at lower
// values, so Malaysia's national guideline sets lower thresholds.
//
// Source: Clinical Practice Guidelines for the Management of Obesity, 2nd
// edition (2023), Ministry of Health Malaysia with the Malaysian Endocrine and
// Metabolic Society:
//
//   "Cut off BMI values that should be used are: pre-obesity (overweight)
//    - 23 kg/m2 and obesity - > 27.5 kg/m2"
//
// The same guideline directs that under-18s be classified with the WHO
// BMI-for-age chart instead. That needs official percentile reference data this
// engine does not carry, so it declines to classify a child rather than applying
// adult categories that would not apply to them.

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very";

/** Malaysian MOH cut-offs, in kg/m². */
export const MOH_CUTOFFS = {
  underweight: 18.5,
  preObese: 23,
  obese: 27.5,
} as const;

/** The international (WHO Caucasian-reference) cut-offs, kept for comparison. */
export const INTERNATIONAL_CUTOFFS = {
  underweight: 18.5,
  overweight: 25,
  obese: 30,
} as const;

/** Age from which adult BMI categories apply, per the CPG. */
export const ADULT_MIN_AGE = 18;

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
};

/** Categories under the Malaysian guideline. */
export type CategoryKey = "underweight" | "normal" | "preObese" | "obese";
/** Categories under the international chart, which names the middle band differently. */
export type InternationalCategoryKey = "underweight" | "normal" | "overweight" | "obese";

export interface BmiInputs {
  /** Height in centimetres. */
  height: number;
  /** Weight in kilograms. */
  weight: number;
  /** Age in years. */
  age: number;
  sex: Sex;
  activity: ActivityLevel;
}

export interface BmiResult {
  bmi: number;
  /** Whether adult BMI categories apply at all. */
  isAdult: boolean;
  /** Category under the Malaysian guideline, or null for an under-18. */
  category: CategoryKey | null;
  /** What the international chart would have said, or null for an under-18. */
  internationalCategory: InternationalCategoryKey | null;
  /** True when the two charts reach different conclusions. */
  categoriesDisagree: boolean;
  /** Basal metabolic rate, Mifflin-St Jeor, in kcal/day. */
  bmr: number;
  /** Total daily energy expenditure in kcal/day. */
  tdee: number;
  /** Lower bound of the healthy weight range in kg. Zero for an under-18. */
  healthyMin: number;
  /** Upper bound of the healthy weight range in kg. Zero for an under-18. */
  healthyMax: number;
}

/** Classify a BMI under the Malaysian MOH cut-offs. */
export function bmiCategory(bmi: number): CategoryKey {
  if (bmi < MOH_CUTOFFS.underweight) return "underweight";
  if (bmi < MOH_CUTOFFS.preObese) return "normal";
  if (bmi <= MOH_CUTOFFS.obese) return "preObese";
  return "obese";
}

/** Classify a BMI under the international chart, for comparison only. */
export function internationalBmiCategory(bmi: number): InternationalCategoryKey {
  if (bmi < INTERNATIONAL_CUTOFFS.underweight) return "underweight";
  if (bmi < INTERNATIONAL_CUTOFFS.overweight) return "normal";
  if (bmi < INTERNATIONAL_CUTOFFS.obese) return "overweight";
  return "obese";
}

/** Whether the two charts describe the same body differently. */
function disagree(moh: CategoryKey, intl: InternationalCategoryKey): boolean {
  // "preObese" and "overweight" are the same band under different names, so the
  // charts only truly disagree when the underlying severity differs.
  const rank: Record<string, number> = {
    underweight: 0,
    normal: 1,
    preObese: 2,
    overweight: 2,
    obese: 3,
  };
  return rank[moh] !== rank[intl];
}

export function calculateBmi(input: BmiInputs): BmiResult {
  const heightM = Math.max(0, input.height) / 100;
  const weight = Math.max(0, input.weight);
  const bmi = heightM > 0 ? weight / (heightM * heightM) : 0;
  const isAdult = input.age >= ADULT_MIN_AGE;

  // Mifflin-St Jeor BMR.
  const bmr =
    input.sex === "male"
      ? 10 * weight + 6.25 * input.height - 5 * input.age + 5
      : 10 * weight + 6.25 * input.height - 5 * input.age - 161;
  const tdee = bmr * ACTIVITY_FACTOR[input.activity];

  if (!isAdult) {
    return {
      bmi,
      isAdult: false,
      category: null,
      internationalCategory: null,
      categoriesDisagree: false,
      bmr,
      tdee,
      healthyMin: 0,
      healthyMax: 0,
    };
  }

  const category = bmiCategory(bmi);
  const internationalCategory = internationalBmiCategory(bmi);

  // The healthy band tops out below the Malaysian pre-obesity cut-off, not the
  // international one, so the target weight matches the category shown.
  const healthyMin = heightM > 0 ? MOH_CUTOFFS.underweight * heightM * heightM : 0;
  const healthyMax = heightM > 0 ? MOH_CUTOFFS.preObese * heightM * heightM : 0;

  return {
    bmi,
    isAdult: true,
    category,
    internationalCategory,
    categoriesDisagree: disagree(category, internationalCategory),
    bmr,
    tdee,
    healthyMin,
    healthyMax,
  };
}

export const BMI_DEFAULTS: BmiInputs = {
  height: 170,
  weight: 70,
  age: 30,
  sex: "male",
  activity: "moderate",
};
