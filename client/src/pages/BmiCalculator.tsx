import { Activity, ArrowRight, Calculator as CalculatorIcon, Flame, HeartPulse, Info, Scale } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { CalculatorHero } from "@/components/CalculatorHero";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { EmbedDialog } from "@/components/EmbedDialog";
import { recordServerEvent, track } from "@/lib/analytics";
import {
  ACTIVITY_FACTOR,
  BMI_DEFAULTS,
  calculateBmi,
  MOH_CUTOFFS,
  type ActivityLevel,
  type BmiInputs as LibBmiInputs,
  type CategoryKey,
  type Sex,
} from "@/lib/bmi";
import {
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

type BmiInputs = LibBmiInputs;

const DEFAULT_INPUTS: BmiInputs = BMI_DEFAULTS;

function parseNumberInput(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputNumber(value: string, maxDecimals = 1): string {
  if (!value.trim()) return "";
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(parsed);
}

function toInputString(value: number): string {
  return value === 0 ? "" : new Intl.NumberFormat("en-MY", { maximumFractionDigits: 1 }).format(value);
}

const CATEGORY_COLOR: Record<CategoryKey, string> = {
  underweight: "#38bdf8",
  normal: "#34d399",
  preObese: "#fbbf24",
  obese: "#f87171",
};

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  maxDecimals,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suffix?: string;
  maxDecimals?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(formatInputNumber(value, maxDecimals ?? 1))}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

const URL_SCHEMA: UrlSchema<BmiInputs> = {
  height: numberField("h"),
  weight: numberField("w"),
  age: numberField("age"),
  sex: enumField<BmiInputs, "sex">("sex", ["male", "female"]),
  activity: enumField<BmiInputs, "activity">("act", ["sedentary", "light", "moderate", "active", "very"]),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function BmiCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<BmiInputs>(() => mergeFromUrl<BmiInputs>(DEFAULT_INPUTS, URL_SCHEMA));
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(URL_SCHEMA), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [heightInput, setHeightInput] = useState(toInputString(initial.height));
  const [weightInput, setWeightInput] = useState(toInputString(initial.weight));
  const [ageInput, setAgeInput] = useState(toInputString(initial.age));
  const [sex, setSex] = useState<Sex>(initial.sex);
  const [activity, setActivity] = useState<ActivityLevel>(initial.activity);

  const parsed = useMemo<BmiInputs>(
    () => ({
      height: Math.max(0, Math.min(260, parseNumberInput(heightInput))),
      weight: Math.max(0, Math.min(500, parseNumberInput(weightInput))),
      age: Math.max(0, Math.min(120, Math.round(parseNumberInput(ageInput)))),
      sex,
      activity,
    }),
    [heightInput, weightInput, ageInput, sex, activity],
  );

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.height > 0 && parsed.weight > 0 && parsed.age > 0;
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);
  const result = useMemo(() => calculateBmi(parsed), [parsed]);
  const showResults = hasCalculated && isValid;

  function handleCalculate() {
    if (!isValid) return;
    setHasCalculated(true);
    setTimeout(() => {
      if (window.innerWidth < 1024) {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 120);

    const payload = {
      height: parsed.height,
      weight: parsed.weight,
      age: parsed.age,
      sex: parsed.sex,
      activity: parsed.activity,
      bmi: Number(result.bmi.toFixed(1)),
      category: result.category,
      tdee: Math.round(result.tdee),
    };
    track("calculator_complete", { calculator: "bmi", ...payload });
    recordServerEvent({ calculator: "bmi", event: "calculator_complete", payload });

    if (onCalculate) {
      const expression = `${parsed.height}cm • ${parsed.weight}kg • ${parsed.age}y • ${parsed.sex}`;
      const label = result.category
        ? t(`bmi.category.${result.category}` as never)
        : t("bmi.child.categoryUnavailable");
      const resultStr = `BMI ${result.bmi.toFixed(1)} (${label}) • ${Math.round(result.tdee)} kcal/day`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setHeightInput(toInputString(DEFAULT_INPUTS.height));
    setWeightInput(toInputString(DEFAULT_INPUTS.weight));
    setAgeInput(toInputString(DEFAULT_INPUTS.age));
    setSex(DEFAULT_INPUTS.sex);
    setActivity(DEFAULT_INPUTS.activity);
    setHasCalculated(false);
  }

  // BMI gauge fill: map 12–40 to 0–100%.
  const gaugePct = Math.max(0, Math.min(100, ((result.bmi - 12) / (40 - 12)) * 100));
  // An under-18 gets no category at all, so the label and colour fall back to a
  // neutral "not classified" rather than borrowing an adult band.
  const categoryLabel = result.category
    ? t(`bmi.category.${result.category}` as never)
    : t("bmi.child.categoryUnavailable");
  const categoryColor = result.category ? CATEGORY_COLOR[result.category] : "#94a3b8";
  const num = (v: number, d = 1) =>
    new Intl.NumberFormat("en-MY", { maximumFractionDigits: d }).format(Number.isFinite(v) ? v : 0);

  return (
    <div className="w-full">
      <CalculatorHero
        category="Health"
        title={t("bmi.title")}
        subtitle={t("bmi.subtitle")}
        badges={[t("bmi.badge"), t("bmi.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("bmi.yourBmi")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {showResults ? num(result.bmi) : "—"}
            </p>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${showResults ? gaugePct : 0}%`, background: categoryColor }}
              />
            </div>
            <p className="mt-2 text-[13px] text-white/60">
              {showResults ? categoryLabel : t("bmi.cta.tapToReveal")}
            </p>
          </div>
        }
      />

      <div className="hk-container py-8 space-y-6 sm:space-y-8 min-w-0">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] min-w-0">
          <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800 min-w-0">
            <CardContent className="space-y-5 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{t("bmi.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("bmi.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={t("bmi.inputs.height")}
                  value={heightInput}
                  onChange={setHeightInput}
                  placeholder="e.g. 170"
                  suffix="cm"
                />
                <NumberField
                  label={t("bmi.inputs.weight")}
                  value={weightInput}
                  onChange={setWeightInput}
                  placeholder="e.g. 70"
                  suffix="kg"
                />
                <NumberField
                  label={t("bmi.inputs.age")}
                  value={ageInput}
                  onChange={setAgeInput}
                  placeholder="e.g. 30"
                  maxDecimals={0}
                  suffix={t("bmi.years")}
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t("bmi.inputs.sex")}</span>
                  <select
                    value={sex}
                    onChange={(event) => setSex(event.target.value as Sex)}
                    className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                  >
                    <option value="male">{t("bmi.sex.male")}</option>
                    <option value="female">{t("bmi.sex.female")}</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("bmi.inputs.activity")}</span>
                <select
                  value={activity}
                  onChange={(event) => setActivity(event.target.value as ActivityLevel)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="sedentary">{t("bmi.activity.sedentary")}</option>
                  <option value="light">{t("bmi.activity.light")}</option>
                  <option value="moderate">{t("bmi.activity.moderate")}</option>
                  <option value="active">{t("bmi.activity.active")}</option>
                  <option value="very">{t("bmi.activity.very")}</option>
                </select>
                <span className="text-xs text-muted-foreground">{t("bmi.inputs.activity.hint")}</span>
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("bmi.disclaimer")}</p>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full gap-2 rounded-2xl text-base font-semibold"
                disabled={!isValid}
                onClick={handleCalculate}
              >
                <CalculatorIcon className="h-4 w-4" />
                {hasCalculated ? t("bmi.cta.recalculate") : t("bmi.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("bmi.yourBmi")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {showResults ? num(result.bmi) : "—"}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${showResults ? gaugePct : 0}%`, background: categoryColor }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {showResults ? categoryLabel : t("bmi.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("bmi.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("bmi.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{t("bmi.category")}</p>
                        <p className="mt-1 text-2xl font-bold" style={{ color: categoryColor }}>
                          {categoryLabel}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Scale className="h-6 w-6" />
                      </div>
                    </div>
                    {result.isAdult && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {t("bmi.healthyRange")}: <span className="font-semibold text-foreground">{num(result.healthyMin)}–{num(result.healthyMax)} kg</span>
                      </p>
                    )}
                    {result.isAdult && (
                      <p className="mt-3 text-xs text-muted-foreground">{t("bmi.cutoffs.note")}</p>
                    )}
                    {result.categoriesDisagree && result.internationalCategory && (
                      <div className="mt-3 rounded-2xl bg-muted/50 px-4 py-3">
                        <p className="text-sm">
                          {t("bmi.international.differs")}{" "}
                          <span className="font-semibold">
                            {t(`bmi.category.${result.internationalCategory}` as never)}
                          </span>
                          .
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("bmi.international.hint")}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!result.isAdult && (
                  <Card className="rounded-2xl sm:rounded-3xl border-amber-200 bg-amber-50/60 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20 min-w-0">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex gap-2">
                        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                        <div>
                          <h3 className="font-semibold text-amber-900 dark:text-amber-200">{t("bmi.child.title")}</h3>
                          <p className="mt-1 text-sm text-amber-900/90 dark:text-amber-200/90">{t("bmi.child.body")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("bmi.bmr"), Math.round(result.bmr), t("bmi.bmr.hint"), Flame],
                    [t("bmi.tdee"), Math.round(result.tdee), t("bmi.tdee.hint"), Activity],
                  ] as [string, number, string, typeof Flame][]).map(([label, value, helper, Icon]) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">
                              {num(value, 0)} <span className="text-sm font-normal text-muted-foreground">kcal</span>
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                          </div>
                          <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 text-primary flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <ShareButton calculator="bmi" state={parsed} schema={URL_SCHEMA} />
                  <SaveButton
                    calculator="bmi"
                    state={parsed}
                    schema={URL_SCHEMA}
                    defaultName={`BMI ${num(result.bmi)} • ${parsed.weight}kg`}
                  />
                  <EmbedDialog calculator="bmi" />
                </div>

                <RelatedToolsCard currentHref="/bmi" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
