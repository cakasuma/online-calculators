import { AlertTriangle, ArrowRight, Calculator as CalculatorIcon, Download, Info, Sparkles, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/hooks/use-locale";
import type { TranslationKey } from "@/lib/i18n";
import { LeadCaptureCard } from "@/components/LeadCaptureCard";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { SalaryPercentile } from "@/components/SalaryPercentile";
import { EmbedDialog } from "@/components/EmbedDialog";
import { recordServerEvent, track } from "@/lib/analytics";
import {
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  stringField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";
import { downloadSalaryPdf } from "@/lib/pdf/salaryPdf";

type ResidentStatus = "resident" | "non-resident";
type WorkerType = "malaysian" | "foreigner";

interface SalaryInputs {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: WorkerType;
  residentStatus: ResidentStatus;
}

interface InputErrors {
  monthlySalary?: TranslationKey;
  annualBonus?: TranslationKey;
  otherRelief?: TranslationKey;
  epfRate?: TranslationKey;
}

const DEFAULT_INPUTS: SalaryInputs = {
  monthlySalary: 6000,
  annualBonus: 0,
  otherRelief: 0,
  epfRate: 11,
  workerType: "malaysian",
  residentStatus: "resident",
};

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

const percent = (value: number) => `${value.toFixed(2)}%`;

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

function toInputString(value: number): string {
  return value === 0 ? "" : new Intl.NumberFormat("en-MY", { maximumFractionDigits: 2 }).format(value);
}

function parseNumberInput(value: string): number {
  if (!value.trim()) return 0;
  const normalized = value.replace(/[,_\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
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

function progressiveTax(annualChargeableIncome: number) {
  const income = Math.max(0, annualChargeableIncome);
  let tax = 0;

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const current = TAX_BRACKETS[i];
    const next = TAX_BRACKETS[i + 1];
    const upper = next?.threshold ?? Infinity;
    if (income > current.threshold) {
      tax += (Math.min(income, upper) - current.threshold) * current.rate;
    }
  }

  return tax;
}

function calculateSalary(input: SalaryInputs) {
  const annualGross = input.monthlySalary * 12 + input.annualBonus;
  const epfRate = input.epfRate / 100;
  const monthlyEpf = input.monthlySalary * epfRate;
  const bonusEpf = input.annualBonus * epfRate;
  const annualEpf = monthlyEpf * 12 + bonusEpf;

  const monthlySocso = input.workerType === "foreigner" ? 0 : Math.min(input.monthlySalary, 6000) * 0.005;
  const monthlyEis = input.workerType === "foreigner" ? 0 : Math.min(input.monthlySalary, 6000) * 0.002;
  const annualSocso = monthlySocso * 12;
  const annualEis = monthlyEis * 12;

  const epfRelief = Math.min(annualEpf, 4000);
  const personalRelief = input.residentStatus === "resident" ? 9000 : 0;
  const chargeableIncome = Math.max(
    0,
    annualGross - epfRelief - annualSocso - annualEis - personalRelief - input.otherRelief,
  );
  const annualIncomeTax =
    input.residentStatus === "non-resident" ? annualGross * 0.3 : progressiveTax(chargeableIncome);
  const monthlyTax = annualIncomeTax / 12;

  const monthlyDeductions = monthlyEpf + monthlySocso + monthlyEis + monthlyTax;
  const monthlyNet = input.monthlySalary - monthlyDeductions;

  return {
    annualGross,
    chargeableIncome,
    monthlyEpf,
    monthlySocso,
    monthlyEis,
    monthlyTax,
    monthlyDeductions,
    monthlyNet,
    annualIncomeTax,
    annualEpf,
    annualSocso,
    annualEis,
  };
}

function validateInputs(input: SalaryInputs): InputErrors {
  const errors: InputErrors = {};

  if (input.monthlySalary <= 0) {
    errors.monthlySalary = "salary.validation.monthlySalary";
  }

  if (input.annualBonus < 0) {
    errors.annualBonus = "salary.validation.annualBonus";
  }

  if (input.otherRelief < 0) {
    errors.otherRelief = "salary.validation.otherRelief";
  }

  const minimumEpfRate = input.workerType === "foreigner" ? 2 : 0;
  if (input.epfRate < minimumEpfRate || input.epfRate > 15) {
    errors.epfRate =
      input.workerType === "foreigner"
        ? "salary.validation.epfForeigner"
        : "salary.validation.epfLocal";
  }

  return errors;
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  maxDecimals,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  maxDecimals?: number;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onChange(formatInputNumber(value, maxDecimals ?? 2))}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:ring-4 dark:bg-slate-950 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 dark:border-red-500/70"
            : "border-slate-200 focus:border-primary focus:ring-primary/10 dark:border-slate-800"
        }`}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

interface SalaryUrlState {
  monthlySalary: number;
  annualBonus: number;
  otherRelief: number;
  epfRate: number;
  workerType: WorkerType;
  residentStatus: ResidentStatus;
}

const SALARY_URL_SCHEMA: UrlSchema<SalaryUrlState> = {
  monthlySalary: numberField("gross"),
  annualBonus: numberField("bonus"),
  otherRelief: numberField("relief"),
  epfRate: {
    key: "epf",
    parse: (raw) => {
      const n = Number(raw);
      return Number.isFinite(n) ? n : undefined;
    },
    // Always emit epfRate so the recipient sees the same configuration even
    // when the value matches the default 11%.
    serialize: (v) => (v == null ? null : String(v)),
  },
  workerType: enumField<SalaryUrlState, "workerType">("worker", ["malaysian", "foreigner"]),
  residentStatus: enumField<SalaryUrlState, "residentStatus">("res", ["resident", "non-resident"]),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function SalaryCalculator({ onCalculate }: Props = {}) {
  const { t, locale } = useLocale();
  // Read URL params once on mount to pre-fill the form when a user opens a
  // shared link. Falls back to DEFAULT_INPUTS for any missing/invalid params.
  const [initial] = useState<SalaryUrlState>(() =>
    mergeFromUrl<SalaryUrlState>(
      {
        monthlySalary: DEFAULT_INPUTS.monthlySalary,
        annualBonus: DEFAULT_INPUTS.annualBonus,
        otherRelief: DEFAULT_INPUTS.otherRelief,
        epfRate: DEFAULT_INPUTS.epfRate,
        workerType: DEFAULT_INPUTS.workerType,
        residentStatus: DEFAULT_INPUTS.residentStatus,
      },
      SALARY_URL_SCHEMA,
    ),
  );
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(SALARY_URL_SCHEMA), []);
  const [monthlySalaryInput, setMonthlySalaryInput] = useState(toInputString(initial.monthlySalary));
  const [annualBonusInput, setAnnualBonusInput] = useState(toInputString(initial.annualBonus));
  const [otherReliefInput, setOtherReliefInput] = useState(toInputString(initial.otherRelief));
  const [epfRateInput, setEpfRateInput] = useState(toInputString(initial.epfRate));
  const [workerType, setWorkerType] = useState<WorkerType>(initial.workerType);
  const [residentStatus, setResidentStatus] = useState<ResidentStatus>(initial.residentStatus);

  const parsedInput = useMemo<SalaryInputs>(
    () => ({
      monthlySalary: Math.max(0, parseNumberInput(monthlySalaryInput) || 0),
      annualBonus: Math.max(0, parseNumberInput(annualBonusInput) || 0),
      otherRelief: Math.max(0, parseNumberInput(otherReliefInput) || 0),
      epfRate: Math.max(0, parseNumberInput(epfRateInput) || 0),
      workerType,
      residentStatus,
    }),
    [monthlySalaryInput, annualBonusInput, otherReliefInput, epfRateInput, workerType, residentStatus],
  );

  const errors = useMemo(() => validateInputs(parsedInput), [parsedInput]);
  const isValid = Object.keys(errors).length === 0;
  // If the user arrived via a shared link, show results immediately so they
  // don't have to click Calculate just to see what was shared.
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);

  // Keep the URL in sync with the form state so the address bar is always a
  // copyable share link. Debounced inside useUrlSync.
  useUrlSync(parsedInput, SALARY_URL_SCHEMA);

  const result = useMemo(
    () => calculateSalary({ ...parsedInput, epfRate: Math.min(15, parsedInput.epfRate) }),
    [parsedInput],
  );

  function handleCalculate() {
    if (!isValid) return;
    setHasCalculated(true);
    const props = {
      monthlySalary: parsedInput.monthlySalary,
      annualBonus: parsedInput.annualBonus,
      workerType: parsedInput.workerType,
      residentStatus: parsedInput.residentStatus,
      monthlyNet: Math.round(result.monthlyNet),
      annualTax: Math.round(result.annualIncomeTax),
    };
    track("calculator_complete", { calculator: "salary", ...props });
    recordServerEvent({ calculator: "salary", event: "calculator_complete", payload: props });

    // Record an entry in the local calculation history so the user can recall
    // this scenario later. Expression carries the headline inputs; result
    // carries the take-home and annual tax.
    if (onCalculate) {
      const gross = Math.round(parsedInput.monthlySalary);
      const bonus = Math.round(parsedInput.annualBonus);
      const expression = `RM ${gross}/mo${bonus ? ` + RM ${bonus} bonus` : ""} • ${parsedInput.residentStatus} • ${parsedInput.workerType}`;
      const resultStr = `Net RM ${Math.round(result.monthlyNet)}/mo • Tax RM ${Math.round(result.annualIncomeTax)}/yr`;
      const url = buildShareUrl(parsedInput, SALARY_URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  const takeHomeRatio =
    parsedInput.monthlySalary > 0
      ? Math.max(0, Math.min(100, (result.monthlyNet / parsedInput.monthlySalary) * 100))
      : 0;

  const hasNegativeTakeHome = result.monthlyNet < 0;

  const taxRateFromGross = result.annualGross > 0 ? (result.annualIncomeTax / result.annualGross) * 100 : 0;
  const monthlyEpfRate = parsedInput.monthlySalary > 0 ? (result.monthlyEpf / parsedInput.monthlySalary) * 100 : 0;
  const monthlyTaxRate = parsedInput.monthlySalary > 0 ? (result.monthlyTax / parsedInput.monthlySalary) * 100 : 0;
  const monthlySocsoRate = parsedInput.monthlySalary > 0 ? (result.monthlySocso / parsedInput.monthlySalary) * 100 : 0;
  const monthlyEisRate = parsedInput.monthlySalary > 0 ? (result.monthlyEis / parsedInput.monthlySalary) * 100 : 0;

  function resetForm() {
    setMonthlySalaryInput(toInputString(DEFAULT_INPUTS.monthlySalary));
    setAnnualBonusInput(toInputString(DEFAULT_INPUTS.annualBonus));
    setOtherReliefInput(toInputString(DEFAULT_INPUTS.otherRelief));
    setEpfRateInput(toInputString(DEFAULT_INPUTS.epfRate));
    setWorkerType(DEFAULT_INPUTS.workerType);
    setResidentStatus(DEFAULT_INPUTS.residentStatus);
    setHasCalculated(false);
  }

  const showResults = hasCalculated && isValid;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-2xl sm:p-10">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Badge className="w-fit border-white/15 bg-white/10 text-emerald-100 hover:bg-white/10">
              {t("salary.badge")}
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{t("salary.title")}</h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {t("salary.subtitle")}
            </p>
          </div>
          <Card className="border-white/10 bg-white/10 text-white backdrop-blur">
            <CardContent className="p-6">
              <p className="text-sm text-emerald-100">{t("salary.takeHomePay")}</p>
              <p className="mt-2 text-4xl font-bold">{money(showResults ? result.monthlyNet : 0)}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${showResults ? takeHomeRatio : 0}%` }} />
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {!isValid
                  ? t("salary.fixInputErrors")
                  : showResults
                  ? `${takeHomeRatio.toFixed(1)}% ${t("salary.ofMonthlyGross")}`
                  : t("salary.cta.tapToReveal")}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{t("salary.inputs.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("salary.inputs.subtitle")}</p>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                {t("common.reset")}
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                label={t("salary.inputs.monthlySalary")}
                value={monthlySalaryInput}
                onChange={setMonthlySalaryInput}
                placeholder="e.g. 6,000"
                error={errors.monthlySalary ? t(errors.monthlySalary) : undefined}
              />
              <NumberField
                label={t("salary.inputs.annualBonus")}
                value={annualBonusInput}
                onChange={setAnnualBonusInput}
                placeholder="e.g. 12,000"
                error={errors.annualBonus ? t(errors.annualBonus) : undefined}
              />
              <NumberField
                label={t("salary.inputs.otherRelief")}
                value={otherReliefInput}
                onChange={setOtherReliefInput}
                placeholder="e.g. 5,000"
                hint={t("salary.inputs.otherRelief.hint")}
                error={errors.otherRelief ? t(errors.otherRelief) : undefined}
              />
              <NumberField
                label={t("salary.inputs.epfRate")}
                value={epfRateInput}
                onChange={setEpfRateInput}
                placeholder="e.g. 11"
                maxDecimals={2}
                hint={
                  workerType === "foreigner"
                    ? t("salary.inputs.epfRate.hint.foreign")
                    : t("salary.inputs.epfRate.hint.local")
                }
                error={errors.epfRate ? t(errors.epfRate) : undefined}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("salary.inputs.workerType")}</span>
                <select
                  value={workerType}
                  onChange={(event) => setWorkerType(event.target.value as WorkerType)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="malaysian">{t("salary.inputs.workerType.malaysian")}</option>
                  <option value="foreigner">{t("salary.inputs.workerType.foreigner")}</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("salary.inputs.taxResidency")}</span>
                <select
                  value={residentStatus}
                  onChange={(event) => setResidentStatus(event.target.value as ResidentStatus)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="resident">{t("salary.inputs.resident")}</option>
                  <option value="non-resident">{t("salary.inputs.nonResident")}</option>
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
              <div className="flex gap-2">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <p>{t("salary.disclaimer")}</p>
              </div>
            </div>

            {hasNegativeTakeHome && isValid ? (
              <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
                <div className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("salary.negativeWarning")}</p>
                </div>
              </div>
            ) : null}

            <Button
              type="button"
              size="lg"
              className="w-full gap-2 rounded-2xl text-base font-semibold"
              disabled={!isValid}
              onClick={handleCalculate}
            >
              <CalculatorIcon className="h-4 w-4" />
              {hasCalculated ? t("salary.cta.recalculate") : t("salary.cta.calculate")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {!showResults ? (
            <Card className="rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
              <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <CalculatorIcon className="h-6 w-6" />
                </div>
                <p className="text-base font-semibold">{t("salary.breakdown.ready")}</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {t("salary.breakdown.hint")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                [t("salary.epfMonth"), result.monthlyEpf, percent(monthlyEpfRate), Wallet],
                [t("salary.taxMonth"), result.monthlyTax, percent(monthlyTaxRate), TrendingUp],
                [t("salary.socsoMonth"), result.monthlySocso, percent(monthlySocsoRate), Info],
                [t("salary.eisMonth"), result.monthlyEis, percent(monthlyEisRate), Info],
              ] as [string, number, string, typeof Wallet][]).map(([label, value, tooltipInfo, Icon]) => (
                <Card key={label} className="rounded-3xl shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-bold">{money(value)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{t("salary.rateEstimate")} {tooltipInfo}</p>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {showResults && <SalaryPercentile monthlyGross={parsedInput.monthlySalary} />}

          {showResults && (
            <LeadCaptureCard
              calculator="salary"
              intent="newsletter"
              source="salary-tax-tips"
              icon={<Sparkles className="w-4 h-4 text-primary" />}
              title={t("salary.lead.title")}
              description={t("salary.lead.desc")}
              ctaLabel={t("salary.lead.cta")}
              successTitle={t("salary.lead.successTitle")}
              successMessage={t("salary.lead.successDesc")}
              disclaimer={t("salary.lead.disclaimer")}
              getContext={() => ({
                monthlySalary: parsedInput.monthlySalary,
                annualBonus: parsedInput.annualBonus,
                workerType: parsedInput.workerType,
                residentStatus: parsedInput.residentStatus,
                monthlyNet: Math.round(result.monthlyNet),
                annualTax: Math.round(result.annualIncomeTax),
              })}
              className="rounded-3xl"
            />
          )}

          {showResults && (
            <Card className="rounded-3xl shadow-sm">
              <CardContent className="p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{t("salary.annual.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("salary.annual.subtitle")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ShareButton
                      calculator="salary"
                      state={parsedInput}
                      schema={SALARY_URL_SCHEMA}
                    />
                    <SaveButton
                      calculator="salary"
                      state={parsedInput}
                      schema={SALARY_URL_SCHEMA}
                      defaultName={`RM ${Math.round(parsedInput.monthlySalary)}/mo${parsedInput.annualBonus ? ` + bonus` : ""}`}
                    />
                    <EmbedDialog calculator="salary" />
                    <Button
                      variant="outline"
                      className="gap-2 rounded-2xl"
                      onClick={() =>
                        downloadSalaryPdf({
                          inputs: parsedInput,
                          result,
                          locale,
                          shareUrl: buildShareUrl(parsedInput, SALARY_URL_SCHEMA),
                        })
                      }
                      data-testid="button-download-pdf"
                    >
                      <Download className="h-4 w-4" /> {t("common.downloadPdf")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {([
                    [t("salary.monthlyTakeHome"), result.monthlyNet, `${takeHomeRatio.toFixed(2)}% ${t("salary.ofGross")}`],
                    [t("salary.annualGross"), result.annualGross, t("salary.beforeDeductions")],
                    [t("salary.chargeableIncome"), result.chargeableIncome, t("salary.afterReliefs")],
                    [t("salary.annualTax"), result.annualIncomeTax, `${t("salary.effectiveTax")} ${percent(taxRateFromGross)}`],
                    [t("salary.estimatedMonthlyTax"), result.monthlyTax, `${t("salary.approxMonthlyRate")} ${percent(monthlyTaxRate)}`],
                    [t("salary.monthlyDeductions"), result.monthlyDeductions, t("salary.deductionItems")],
                  ] as [string, number, string][]).map(([label, value, helper]) => (
                    <div key={label} className="rounded-2xl bg-muted/50 px-4 py-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-muted-foreground">{label}</span>
                        <span className="font-semibold">{money(value)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
