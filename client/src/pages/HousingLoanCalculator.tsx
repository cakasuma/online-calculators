import { ArrowRight, Calculator as CalculatorIcon, Home, Info, Receipt, Wallet } from "lucide-react";
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

interface HousingInputs {
  price: number;
  downPct: number;
  tenureYears: number;
  rate: number;
  firstHome: "yes" | "no";
}

const DEFAULT_INPUTS: HousingInputs = {
  price: 500000,
  downPct: 10,
  tenureYears: 35,
  rate: 4,
  firstHome: "no",
};

const money = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const money2 = (value: number) =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

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

/** Memorandum of Transfer (MOT) ad-valorem stamp duty — 2024 Malaysian tiers. */
function motStampDuty(price: number): number {
  const tiers = [
    { upTo: 100000, rate: 0.01 },
    { upTo: 500000, rate: 0.02 },
    { upTo: 1000000, rate: 0.03 },
    { upTo: Infinity, rate: 0.04 },
  ];
  let duty = 0;
  let prev = 0;
  for (const tier of tiers) {
    if (price > prev) {
      duty += (Math.min(price, tier.upTo) - prev) * tier.rate;
      prev = tier.upTo;
    } else break;
  }
  return duty;
}

/** Legal fees scale (Solicitors' Remuneration Order) applied to a sum. */
function legalScale(amount: number): number {
  const tiers = [
    { upTo: 500000, rate: 0.0125 },
    { upTo: 1000000, rate: 0.01 },
    { upTo: 3000000, rate: 0.007 },
    { upTo: Infinity, rate: 0.006 },
  ];
  let fee = 0;
  let prev = 0;
  for (const tier of tiers) {
    if (amount > prev) {
      fee += (Math.min(amount, tier.upTo) - prev) * tier.rate;
      prev = tier.upTo;
    } else break;
  }
  return fee;
}

function calculate(input: HousingInputs) {
  const downPayment = input.price * (input.downPct / 100);
  const loanAmount = Math.max(0, input.price - downPayment);
  const months = Math.max(1, Math.round(input.tenureYears * 12));
  const monthlyRate = input.rate / 100 / 12;

  const monthlyInstallment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  const totalPayment = monthlyInstallment * months;
  const totalInterest = totalPayment - loanAmount;

  // First-home buyers enjoy full stamp-duty exemption (MOT + loan agreement)
  // when the property price is RM500,000 or below.
  const exempt = input.firstHome === "yes" && input.price <= 500000;
  const motDuty = exempt ? 0 : motStampDuty(input.price);
  const loanDuty = exempt ? 0 : loanAmount * 0.005; // loan agreement stamp duty = 0.5%
  const legalFees = legalScale(input.price) + legalScale(loanAmount); // SPA + loan agreement

  const totalUpfront = downPayment + motDuty + loanDuty + legalFees;

  return {
    downPayment,
    loanAmount,
    monthlyInstallment,
    totalPayment,
    totalInterest,
    motDuty,
    loanDuty,
    legalFees,
    totalUpfront,
    exempt,
  };
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  maxDecimals,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  maxDecimals?: number;
  suffix?: string;
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

const URL_SCHEMA: UrlSchema<HousingInputs> = {
  price: numberField("price"),
  downPct: numberField("down"),
  tenureYears: numberField("tenure"),
  rate: numberField("rate"),
  firstHome: enumField<HousingInputs, "firstHome">("first", ["yes", "no"]),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function HousingLoanCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<HousingInputs>(() => mergeFromUrl<HousingInputs>(DEFAULT_INPUTS, URL_SCHEMA));
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(URL_SCHEMA), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [priceInput, setPriceInput] = useState(toInputString(initial.price));
  const [downInput, setDownInput] = useState(toInputString(initial.downPct));
  const [tenureInput, setTenureInput] = useState(toInputString(initial.tenureYears));
  const [rateInput, setRateInput] = useState(toInputString(initial.rate));
  const [firstHome, setFirstHome] = useState<"yes" | "no">(initial.firstHome);

  const parsed = useMemo<HousingInputs>(
    () => ({
      price: Math.max(0, parseNumberInput(priceInput)),
      downPct: Math.max(0, Math.min(100, parseNumberInput(downInput))),
      tenureYears: Math.max(1, Math.min(40, parseNumberInput(tenureInput) || 1)),
      rate: Math.max(0, Math.min(15, parseNumberInput(rateInput))),
      firstHome,
    }),
    [priceInput, downInput, tenureInput, rateInput, firstHome],
  );

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.price > 0;
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
      price: Math.round(parsed.price),
      downPct: parsed.downPct,
      tenureYears: parsed.tenureYears,
      rate: parsed.rate,
      firstHome: parsed.firstHome,
      monthlyInstallment: Math.round(result.monthlyInstallment),
      totalUpfront: Math.round(result.totalUpfront),
    };
    track("calculator_complete", { calculator: "housing", ...payload });
    recordServerEvent({ calculator: "housing", event: "calculator_complete", payload });

    if (onCalculate) {
      const expression = `RM ${Math.round(parsed.price)} • ${parsed.downPct}% down • ${parsed.tenureYears}yr @ ${parsed.rate}%`;
      const resultStr = `RM ${Math.round(result.monthlyInstallment)}/mo • RM ${Math.round(result.totalUpfront)} upfront`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setPriceInput(toInputString(DEFAULT_INPUTS.price));
    setDownInput(toInputString(DEFAULT_INPUTS.downPct));
    setTenureInput(toInputString(DEFAULT_INPUTS.tenureYears));
    setRateInput(toInputString(DEFAULT_INPUTS.rate));
    setFirstHome(DEFAULT_INPUTS.firstHome);
    setHasCalculated(false);
  }

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={t("housing.title")}
        subtitle={t("housing.subtitle")}
        badges={[t("housing.badge"), t("housing.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("housing.monthlyInstallment")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {money2(showResults ? result.monthlyInstallment : 0)}
            </p>
            <p className="mt-4 text-[13px] text-white/60">
              {showResults ? `${t("housing.over")} ${parsed.tenureYears} ${t("housing.years")}` : t("housing.cta.tapToReveal")}
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
                  <h2 className="text-xl font-semibold">{t("housing.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("housing.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={t("housing.inputs.price")}
                  value={priceInput}
                  onChange={setPriceInput}
                  placeholder="e.g. 500,000"
                />
                <NumberField
                  label={t("housing.inputs.downPct")}
                  value={downInput}
                  onChange={setDownInput}
                  placeholder="e.g. 10"
                  suffix="%"
                  hint={t("housing.inputs.downPct.hint")}
                />
                <NumberField
                  label={t("housing.inputs.tenure")}
                  value={tenureInput}
                  onChange={setTenureInput}
                  placeholder="e.g. 35"
                  maxDecimals={0}
                  suffix={t("housing.years")}
                />
                <NumberField
                  label={t("housing.inputs.rate")}
                  value={rateInput}
                  onChange={setRateInput}
                  placeholder="e.g. 4.0"
                  suffix="%"
                  hint={t("housing.inputs.rate.hint")}
                />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("housing.inputs.firstHome")}</span>
                <select
                  value={firstHome}
                  onChange={(event) => setFirstHome(event.target.value as "yes" | "no")}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="no">{t("common.no")}</option>
                  <option value="yes">{t("common.yes")}</option>
                </select>
                <span className="text-xs text-muted-foreground">{t("housing.inputs.firstHome.hint")}</span>
              </label>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <div className="flex gap-2">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>{t("housing.disclaimer")}</p>
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
                {hasCalculated ? t("housing.cta.recalculate") : t("housing.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("housing.monthlyInstallment")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {money2(showResults ? result.monthlyInstallment : 0)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {showResults ? `${t("housing.over")} ${parsed.tenureYears} ${t("housing.years")}` : t("housing.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Home className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("housing.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("housing.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("housing.loanAmount"), result.loanAmount, Wallet],
                    [t("housing.totalInterest"), result.totalInterest, Receipt],
                  ] as [string, number, typeof Wallet][]).map(([label, value, Icon]) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">{money(value)}</p>
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
                        <h2 className="text-xl font-semibold">{t("housing.upfront.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("housing.upfront.subtitle")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShareButton calculator="housing" state={parsed} schema={URL_SCHEMA} />
                        <SaveButton
                          calculator="housing"
                          state={parsed}
                          schema={URL_SCHEMA}
                          defaultName={`RM ${Math.round(parsed.price)} home`}
                        />
                        <EmbedDialog calculator="housing" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {([
                        [t("housing.downPayment"), result.downPayment, `${parsed.downPct}% ${t("housing.ofPrice")}`],
                        [t("housing.motStampDuty"), result.motDuty, result.exempt ? t("housing.exempt") : t("housing.motStampDuty.hint")],
                        [t("housing.loanStampDuty"), result.loanDuty, result.exempt ? t("housing.exempt") : t("housing.loanStampDuty.hint")],
                        [t("housing.legalFees"), result.legalFees, t("housing.legalFees.hint")],
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
                          <span className="text-sm font-semibold min-w-0 break-words">{t("housing.totalUpfront")}</span>
                          <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                            {money(result.totalUpfront)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("housing.totalUpfront.hint")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <RelatedToolsCard currentHref="/housing-loan" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
