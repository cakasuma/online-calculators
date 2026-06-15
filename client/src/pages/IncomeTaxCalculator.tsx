import { ArrowRight, Calculator as CalculatorIcon, Info, Landmark, Percent, Receipt } from "lucide-react";
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
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

interface TaxInputs {
  annualIncome: number;
  epfLife: number;
  lifestyle: number;
  medical: number;
  education: number;
  children: number;
  spouse: "yes" | "no";
}

const DEFAULT_INPUTS: TaxInputs = {
  annualIncome: 72000,
  epfLife: 4000,
  lifestyle: 2500,
  medical: 0,
  education: 0,
  children: 0,
  spouse: "no",
};

// Resident progressive bands — Malaysia YA 2026 (chargeable income).
const TAX_BRACKETS = [
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

const PERSONAL_RELIEF = 9000;
const SPOUSE_RELIEF = 4000;
const CHILD_RELIEF = 2000;
const CAP = { epfLife: 7000, lifestyle: 2500, medical: 10000, education: 8000 };

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const percent = (value: number) => `${value.toFixed(2)}%`;

function parseNumberInput(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputNumber(value: string, maxDecimals = 2): string {
  if (!value.trim()) return "";
  const parsed = parseNumberInput(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(parsed);
}

function toInputString(value: number): string {
  return value === 0 ? "" : new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 }).format(value);
}

function progressiveTax(income: number) {
  const chargeable = Math.max(0, income);
  let tax = 0;
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const current = TAX_BRACKETS[i];
    const next = TAX_BRACKETS[i + 1];
    const upper = next?.threshold ?? Infinity;
    if (chargeable > current.threshold) {
      tax += (Math.min(chargeable, upper) - current.threshold) * current.rate;
    }
  }
  return tax;
}

function calculate(input: TaxInputs) {
  const reliefs =
    PERSONAL_RELIEF +
    Math.min(input.epfLife, CAP.epfLife) +
    Math.min(input.lifestyle, CAP.lifestyle) +
    Math.min(input.medical, CAP.medical) +
    Math.min(input.education, CAP.education) +
    (input.spouse === "yes" ? SPOUSE_RELIEF : 0) +
    Math.max(0, input.children) * CHILD_RELIEF;

  const totalReliefs = reliefs;
  const chargeableIncome = Math.max(0, input.annualIncome - totalReliefs);
  const taxBeforeRebate = progressiveTax(chargeableIncome);

  // Individual rebate: RM400 when chargeable income ≤ RM35,000, plus RM400
  // more when a spouse relief is claimed.
  const rebate = chargeableIncome <= 35000 ? 400 + (input.spouse === "yes" ? 400 : 0) : 0;
  const taxPayable = Math.max(0, taxBeforeRebate - rebate);
  const effectiveRate = input.annualIncome > 0 ? (taxPayable / input.annualIncome) * 100 : 0;
  const monthlyPcb = taxPayable / 12;

  return { totalReliefs, chargeableIncome, taxBeforeRebate, rebate, taxPayable, effectiveRate, monthlyPcb };
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  suffix,
  maxDecimals,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
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
          onBlur={() => onChange(formatInputNumber(value, maxDecimals ?? 2))}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950"
        />
        {suffix && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

const URL_SCHEMA: UrlSchema<TaxInputs> = {
  annualIncome: numberField("income"),
  epfLife: numberField("epf"),
  lifestyle: numberField("life"),
  medical: numberField("med"),
  education: numberField("edu"),
  children: numberField("kids"),
  spouse: enumField<TaxInputs, "spouse">("spouse", ["yes", "no"]),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function IncomeTaxCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<TaxInputs>(() => mergeFromUrl<TaxInputs>(DEFAULT_INPUTS, URL_SCHEMA));
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(URL_SCHEMA), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [incomeInput, setIncomeInput] = useState(toInputString(initial.annualIncome));
  const [epfInput, setEpfInput] = useState(toInputString(initial.epfLife));
  const [lifestyleInput, setLifestyleInput] = useState(toInputString(initial.lifestyle));
  const [medicalInput, setMedicalInput] = useState(toInputString(initial.medical));
  const [educationInput, setEducationInput] = useState(toInputString(initial.education));
  const [childrenInput, setChildrenInput] = useState(toInputString(initial.children));
  const [spouse, setSpouse] = useState<"yes" | "no">(initial.spouse);

  const parsed = useMemo<TaxInputs>(
    () => ({
      annualIncome: Math.max(0, parseNumberInput(incomeInput)),
      epfLife: Math.max(0, parseNumberInput(epfInput)),
      lifestyle: Math.max(0, parseNumberInput(lifestyleInput)),
      medical: Math.max(0, parseNumberInput(medicalInput)),
      education: Math.max(0, parseNumberInput(educationInput)),
      children: Math.max(0, Math.round(parseNumberInput(childrenInput))),
      spouse,
    }),
    [incomeInput, epfInput, lifestyleInput, medicalInput, educationInput, childrenInput, spouse],
  );

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.annualIncome > 0;
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);
  const result = useMemo(() => calculate(parsed), [parsed]);
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
      annualIncome: Math.round(parsed.annualIncome),
      chargeableIncome: Math.round(result.chargeableIncome),
      taxPayable: Math.round(result.taxPayable),
      effectiveRate: Number(result.effectiveRate.toFixed(2)),
      monthlyPcb: Math.round(result.monthlyPcb),
    };
    track("calculator_complete", { calculator: "tax", ...payload });
    recordServerEvent({ calculator: "tax", event: "calculator_complete", payload });

    if (onCalculate) {
      const expression = `RM ${Math.round(parsed.annualIncome)}/yr • ${parsed.children} ${parsed.children === 1 ? "child" : "children"}${parsed.spouse === "yes" ? " • spouse" : ""}`;
      const resultStr = `Tax RM ${Math.round(result.taxPayable)}/yr • ${result.effectiveRate.toFixed(2)}% effective`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setIncomeInput(toInputString(DEFAULT_INPUTS.annualIncome));
    setEpfInput(toInputString(DEFAULT_INPUTS.epfLife));
    setLifestyleInput(toInputString(DEFAULT_INPUTS.lifestyle));
    setMedicalInput(toInputString(DEFAULT_INPUTS.medical));
    setEducationInput(toInputString(DEFAULT_INPUTS.education));
    setChildrenInput(toInputString(DEFAULT_INPUTS.children));
    setSpouse(DEFAULT_INPUTS.spouse);
    setHasCalculated(false);
  }

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={t("tax.title")}
        subtitle={t("tax.subtitle")}
        badges={[t("tax.badge"), t("tax.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("tax.taxPayable")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {money(showResults ? result.taxPayable : 0)}
            </p>
            <p className="mt-4 text-[13px] text-white/60">
              {showResults
                ? `${t("tax.effectiveRate")} ${percent(result.effectiveRate)}`
                : t("tax.cta.tapToReveal")}
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
                  <h2 className="text-xl font-semibold">{t("tax.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("tax.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <NumberField
                label={t("tax.inputs.income")}
                value={incomeInput}
                onChange={setIncomeInput}
                placeholder="e.g. 72,000"
                hint={t("tax.inputs.income.hint")}
              />

              <div className="pt-1">
                <p className="text-sm font-semibold">{t("tax.reliefs.title")}</p>
                <p className="text-xs text-muted-foreground">{t("tax.reliefs.subtitle")}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={t("tax.inputs.epfLife")}
                  value={epfInput}
                  onChange={setEpfInput}
                  placeholder="max 7,000"
                  hint={t("tax.inputs.epfLife.hint")}
                />
                <NumberField
                  label={t("tax.inputs.lifestyle")}
                  value={lifestyleInput}
                  onChange={setLifestyleInput}
                  placeholder="max 2,500"
                  hint={t("tax.inputs.lifestyle.hint")}
                />
                <NumberField
                  label={t("tax.inputs.medical")}
                  value={medicalInput}
                  onChange={setMedicalInput}
                  placeholder="max 10,000"
                  hint={t("tax.inputs.medical.hint")}
                />
                <NumberField
                  label={t("tax.inputs.education")}
                  value={educationInput}
                  onChange={setEducationInput}
                  placeholder="max 8,000"
                  hint={t("tax.inputs.education.hint")}
                />
                <NumberField
                  label={t("tax.inputs.children")}
                  value={childrenInput}
                  onChange={setChildrenInput}
                  placeholder="e.g. 2"
                  maxDecimals={0}
                  hint={t("tax.inputs.children.hint")}
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium">{t("tax.inputs.spouse")}</span>
                  <select
                    value={spouse}
                    onChange={(event) => setSpouse(event.target.value as "yes" | "no")}
                    className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                  >
                    <option value="no">{t("common.no")}</option>
                    <option value="yes">{t("common.yes")}</option>
                  </select>
                  <span className="text-xs text-muted-foreground">{t("tax.inputs.spouse.hint")}</span>
                </label>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("tax.disclaimer")}</p>
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
                {hasCalculated ? t("tax.cta.recalculate") : t("tax.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("tax.taxPayable")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {money(showResults ? result.taxPayable : 0)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {showResults ? `${t("tax.effectiveRate")} ${percent(result.effectiveRate)}` : t("tax.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Landmark className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("tax.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("tax.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("tax.monthlyPcb"), result.monthlyPcb, Receipt],
                    [t("tax.effectiveRateLabel"), result.effectiveRate, Percent],
                  ] as [string, number, typeof Receipt][]).map(([label, value, Icon], i) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">
                              {i === 1 ? percent(value) : money(value)}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-primary/10 p-2.5 sm:p-3 text-primary flex-shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                  <CardContent className="p-4 sm:p-6 min-w-0">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">{t("tax.breakdown.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("tax.breakdown.subtitle")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShareButton calculator="tax" state={parsed} schema={URL_SCHEMA} />
                        <SaveButton
                          calculator="tax"
                          state={parsed}
                          schema={URL_SCHEMA}
                          defaultName={`Tax RM ${Math.round(parsed.annualIncome)}/yr`}
                        />
                        <EmbedDialog calculator="tax" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {([
                        [t("tax.totalReliefs"), result.totalReliefs, t("tax.totalReliefs.hint")],
                        [t("tax.chargeableIncome"), result.chargeableIncome, t("tax.chargeableIncome.hint")],
                        [t("tax.taxBeforeRebate"), result.taxBeforeRebate, t("tax.taxBeforeRebate.hint")],
                        [t("tax.rebate"), result.rebate, t("tax.rebate.hint")],
                      ] as [string, number, string][]).map(([label, value, helper]) => (
                        <div key={label} className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-muted-foreground min-w-0 break-words">{label}</span>
                            <span className="font-semibold tabular-nums text-right break-words">{money(value)}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                        </div>
                      ))}
                      <div className="rounded-2xl bg-primary/10 px-3 sm:px-4 py-3.5 min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="text-sm font-semibold min-w-0 break-words">{t("tax.taxPayable")}</span>
                          <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                            {money(result.taxPayable)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t("tax.effectiveRate")} {percent(result.effectiveRate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <RelatedToolsCard currentHref="/income-tax" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
