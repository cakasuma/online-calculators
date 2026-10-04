import { AlertTriangle, ArrowRight, Calculator as CalculatorIcon, Car, Percent, PiggyBank, Receipt, Wallet } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/hooks/use-locale";
import { CalculatorHero } from "@/components/CalculatorHero";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import { ShareButton } from "@/components/ShareButton";
import { SaveButton } from "@/components/SaveButton";
import { recordServerEvent, track } from "@/lib/analytics";
import { calculateCarLoan, CAR_LOAN_DEFAULTS, type CarLoanInputs, type HpRegime } from "@/lib/carLoan";
import {
  boolField,
  buildShareUrl,
  enumField,
  mergeFromUrl,
  numberField,
  urlHasSchemaParams,
  useUrlSync,
  type UrlSchema,
} from "@/lib/urlState";

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
  let s = value.replace(/[_\s]/g, "");
  if (s.includes(",") && s.includes(".")) {
    // Both separators present: assume "," = thousands, "." = decimal.
    s = s.replace(/,/g, "");
  } else if (s.includes(",")) {
    // Only commas. Treat a single comma followed by 1–2 digits as a decimal
    // separator (e.g. the "3,5" rates shown in the Indonesian locale);
    // otherwise treat commas as thousands separators (e.g. "90,000").
    const parts = s.split(",");
    s =
      parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : s.replace(/,/g, "");
  }
  const parsed = Number(s);
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

const URL_SCHEMA: UrlSchema<CarLoanInputs> = {
  price: numberField("price"),
  // 0% down and 0% interest are valid, non-default choices — keep them in
  // shared links so the recipient sees the same scenario.
  downPct: numberField("down", { keepZero: true }),
  flatRate: numberField("rate", { keepZero: true }),
  tenureYears: numberField("tenure"),
  regime: enumField<CarLoanInputs, "regime">("regime", ["reducing", "flat"]),
  // Month 0 is a real choice — settling before the first instalment.
  settleAfterMonths: numberField("settle", { keepZero: true }),
};

interface Props {
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function CarLoanCalculator({ onCalculate }: Props = {}) {
  const { t } = useLocale();
  const [initial] = useState<CarLoanInputs>(() => mergeFromUrl<CarLoanInputs>(CAR_LOAN_DEFAULTS, URL_SCHEMA));
  const arrivedViaShare = useMemo(() => urlHasSchemaParams(URL_SCHEMA), []);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [priceInput, setPriceInput] = useState(toInputString(initial.price));
  const [downInput, setDownInput] = useState(toInputString(initial.downPct));
  const [rateInput, setRateInput] = useState(toInputString(initial.flatRate));
  const [tenureInput, setTenureInput] = useState(toInputString(initial.tenureYears));
  const [regime, setRegime] = useState<HpRegime>(initial.regime ?? "reducing");
  const [settleEnabled, setSettleEnabled] = useState(initial.settleAfterMonths != null);
  const [settleInput, setSettleInput] = useState(toInputString(initial.settleAfterMonths ?? 0));
  const [showSchedule, setShowSchedule] = useState(false);

  const tenureYears = Math.max(1, Math.min(9, parseNumberInput(tenureInput) || 1));

  const parsed = useMemo<CarLoanInputs>(
    () => ({
      price: Math.max(0, parseNumberInput(priceInput)),
      downPct: Math.max(0, Math.min(100, parseNumberInput(downInput))),
      flatRate: Math.max(0, Math.min(15, parseNumberInput(rateInput))),
      tenureYears,
      regime,
      settleAfterMonths: settleEnabled
        ? Math.max(0, Math.min(tenureYears * 12, Math.round(parseNumberInput(settleInput))))
        : undefined,
    }),
    [priceInput, downInput, rateInput, tenureYears, regime, settleEnabled, settleInput],
  );

  useUrlSync(parsed, URL_SCHEMA);

  const isValid = parsed.price > 0;
  const [hasCalculated, setHasCalculated] = useState(arrivedViaShare && isValid);
  const result = useMemo(() => calculateCarLoan(parsed), [parsed]);
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
      flatRate: parsed.flatRate,
      tenureYears: parsed.tenureYears,
      regime: parsed.regime,
      monthlyInstalment: Math.round(result.monthlyInstalment),
      totalInterest: Math.round(result.totalInterest),
    };
    track("calculator_complete", { calculator: "carloan", ...payload });
    recordServerEvent({ calculator: "carloan", event: "calculator_complete", payload });

    if (onCalculate) {
      const basis = parsed.regime === "flat" ? "flat" : "reducing";
      const expression = `RM ${Math.round(parsed.price)} • ${parsed.downPct}% down • ${parsed.tenureYears}yr @ ${parsed.flatRate}% ${basis}`;
      const resultStr = `RM ${Math.round(result.monthlyInstalment)}/mo • ${result.effectiveRate.toFixed(2)}% eff.`;
      const url = buildShareUrl(parsed, URL_SCHEMA);
      onCalculate(expression, resultStr, url);
    }
  }

  function resetForm() {
    setPriceInput(toInputString(CAR_LOAN_DEFAULTS.price));
    setDownInput(toInputString(CAR_LOAN_DEFAULTS.downPct));
    setRateInput(toInputString(CAR_LOAN_DEFAULTS.flatRate));
    setTenureInput(toInputString(CAR_LOAN_DEFAULTS.tenureYears));
    setRegime(CAR_LOAN_DEFAULTS.regime ?? "reducing");
    setSettleEnabled(false);
    setSettleInput("");
    setHasCalculated(false);
  }

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={t("carloan.title")}
        subtitle={t("carloan.subtitle")}
        badges={[t("carloan.badge"), t("carloan.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("carloan.monthlyInstalment")}</p>
            <p className="mt-2 text-3xl md:text-4xl font-bold break-words tabular-nums">
              {money2(showResults ? result.monthlyInstalment : 0)}
            </p>
            <p className="mt-4 text-[13px] text-white/60">
              {showResults ? `${t("carloan.over")} ${parsed.tenureYears} ${t("carloan.years")}` : t("carloan.cta.tapToReveal")}
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
                  <h2 className="text-xl font-semibold">{t("carloan.inputs.title")}</h2>
                  <p className="text-sm text-muted-foreground">{t("carloan.inputs.subtitle")}</p>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={resetForm}>
                  {t("common.reset")}
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label={t("carloan.inputs.price")}
                  value={priceInput}
                  onChange={setPriceInput}
                  placeholder="e.g. 90,000"
                />
                <NumberField
                  label={t("carloan.inputs.downPct")}
                  value={downInput}
                  onChange={setDownInput}
                  placeholder="e.g. 10"
                  suffix="%"
                  hint={t("carloan.inputs.downPct.hint")}
                />
                <NumberField
                  label={regime === "flat" ? t("carloan.rateFlat") : t("carloan.inputs.rate")}
                  value={rateInput}
                  onChange={setRateInput}
                  placeholder={regime === "flat" ? "e.g. 3.0" : "e.g. 5.5"}
                  suffix="%"
                  hint={regime === "flat" ? t("carloan.rateFlat.hint") : t("carloan.inputs.rate.hint")}
                />
                <NumberField
                  label={t("carloan.inputs.tenure")}
                  value={tenureInput}
                  onChange={setTenureInput}
                  placeholder="e.g. 9"
                  maxDecimals={0}
                  suffix={t("carloan.years")}
                />
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium">{t("carloan.inputs.regime")}</span>
                <select
                  value={regime}
                  onChange={(event) => setRegime(event.target.value as HpRegime)}
                  className="w-full rounded-2xl border bg-background px-4 py-3 shadow-sm"
                >
                  <option value="reducing">{t("carloan.regime.reducing")}</option>
                  <option value="flat">{t("carloan.regime.flat")}</option>
                </select>
                <span className="text-xs text-muted-foreground">{t("carloan.regime.hint")}</span>
              </label>

              {regime === "flat" && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-200">
                  <div className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <p>{t("carloan.flatWarning")}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">{t("carloan.settle.title")}</h3>
                <label className="flex items-center justify-between gap-3 rounded-2xl bg-muted/40 px-4 py-3">
                  <span className="text-sm font-medium">{t("carloan.settle.enable")}</span>
                  <Switch checked={settleEnabled} onCheckedChange={setSettleEnabled} />
                </label>
                {settleEnabled && (
                  <NumberField
                    label={t("carloan.settle.after")}
                    value={settleInput}
                    onChange={setSettleInput}
                    placeholder={`0 - ${tenureYears * 12}`}
                    maxDecimals={0}
                    hint={t("carloan.settle.after.hint")}
                  />
                )}
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
                <p>{t("carloan.disclaimer")}</p>
              </div>

              <Button
                type="button"
                size="lg"
                className="w-full gap-2 rounded-2xl text-base font-semibold"
                disabled={!isValid}
                onClick={handleCalculate}
              >
                <CalculatorIcon className="h-4 w-4" />
                {hasCalculated ? t("carloan.cta.recalculate") : t("carloan.cta.calculate")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div ref={resultsRef} className="space-y-6 min-w-0">
            <Card className="lg:hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-indigo-900/50 text-white">
              <CardContent className="p-4 sm:p-6">
                <p className="text-sm text-indigo-100">{t("carloan.monthlyInstalment")}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold break-words tabular-nums">
                  {money2(showResults ? result.monthlyInstalment : 0)}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {showResults ? `${t("carloan.over")} ${parsed.tenureYears} ${t("carloan.years")}` : t("carloan.cta.tapToReveal")}
                </p>
              </CardContent>
            </Card>

            {!showResults ? (
              <Card className="rounded-2xl sm:rounded-3xl border-dashed border-slate-300/60 bg-slate-50/40 dark:border-slate-700 dark:bg-slate-900/30">
                <CardContent className="flex flex-col items-center justify-center gap-3 p-6 sm:p-10 text-center">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Car className="h-6 w-6" />
                  </div>
                  <p className="text-base font-semibold">{t("carloan.breakdown.ready")}</p>
                  <p className="max-w-sm text-sm text-muted-foreground">{t("carloan.breakdown.hint")}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 min-w-0">
                  {([
                    [t("carloan.loanAmount"), money(result.loanAmount), Wallet],
                    [t("carloan.totalInterest"), money(result.totalInterest), Receipt],
                  ] as [string, string, typeof Wallet][]).map(([label, value, Icon]) => (
                    <Card key={label} className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
                            <p className="mt-1 text-xl sm:text-2xl font-bold break-words tabular-nums">{value}</p>
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
                        <h2 className="text-xl font-semibold">{t("carloan.summary.title")}</h2>
                        <p className="text-sm text-muted-foreground">{t("carloan.summary.subtitle")}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <ShareButton calculator="carloan" state={parsed} schema={URL_SCHEMA} />
                        <SaveButton
                          calculator="carloan"
                          state={parsed}
                          schema={URL_SCHEMA}
                          defaultName={`RM ${Math.round(parsed.price)} car`}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      {([
                        [t("carloan.downPayment"), money(result.downPayment), `${parsed.downPct}%`],
                        [t("carloan.totalPayable"), money(result.totalPayable), t("carloan.totalPayable.hint")],
                      ] as [string, string, string][]).map(([label, value, helper]) => (
                        <div key={label} className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-muted-foreground min-w-0 break-words">{label}</span>
                            <span className="font-semibold tabular-nums text-right break-words">{value}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
                        </div>
                      ))}
                      <div className="rounded-2xl bg-primary/10 px-3 sm:px-4 py-3.5 min-w-0">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <span className="flex items-center gap-1.5 text-sm font-semibold min-w-0 break-words">
                            <Percent className="h-4 w-4 flex-shrink-0" />
                            {t("carloan.effectiveRate")}
                          </span>
                          <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                            {result.effectiveRate.toFixed(2)}%
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{t("carloan.effectiveRate.hint")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {result.settlement && (
                  <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 flex-shrink-0 text-primary" />
                        <h2 className="text-xl font-semibold">{t("carloan.settle.title")}</h2>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm text-muted-foreground min-w-0 break-words">
                              {t("carloan.settle.paid")}
                            </span>
                            <span className="font-semibold tabular-nums text-right break-words">
                              {money(result.settlement.instalmentsPaid)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {result.settlement.afterMonths} / {result.months}
                          </p>
                        </div>

                        {result.regime === "flat" && (
                          <div className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                            <div className="flex items-center justify-between gap-3 min-w-0">
                              <span className="text-sm text-muted-foreground min-w-0 break-words">
                                {t("carloan.settle.rebate")}
                              </span>
                              <span className="font-semibold tabular-nums text-right break-words">
                                {money(result.settlement.rebate)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{t("carloan.settle.rebate.hint")}</p>
                          </div>
                        )}

                        <div className="rounded-2xl bg-primary/10 px-3 sm:px-4 py-3.5 min-w-0">
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            <span className="text-sm font-semibold min-w-0 break-words">
                              {t("carloan.settle.amount")}
                            </span>
                            <span className="text-lg font-bold tabular-nums text-right text-primary break-words">
                              {money(result.settlement.amountToSettle)}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{t("carloan.settle.amount.hint")}</p>
                        </div>

                        {result.settlement.goodwillDiscount > 0 && (
                          <>
                            <div className="rounded-2xl bg-muted/50 px-3 sm:px-4 py-3 min-w-0">
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-sm text-muted-foreground min-w-0 break-words">
                                  {t("carloan.settle.reducing")}
                                </span>
                                <span className="font-semibold tabular-nums text-right break-words">
                                  {money(result.settlement.reducingComparison)}
                                </span>
                              </div>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 px-3 sm:px-4 py-3.5 min-w-0 dark:bg-emerald-950/20">
                              <div className="flex items-center justify-between gap-3 min-w-0">
                                <span className="text-sm font-semibold min-w-0 break-words text-emerald-700 dark:text-emerald-300">
                                  {t("carloan.settle.goodwill")}
                                </span>
                                <span className="text-lg font-bold tabular-nums text-right break-words text-emerald-700 dark:text-emerald-300">
                                  {money(result.settlement.goodwillDiscount)}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{t("carloan.settle.goodwill.hint")}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result.schedule.length > 0 && (
                  <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
                    <CardContent className="p-4 sm:p-6 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-xl font-semibold">{t("carloan.schedule.title")}</h2>
                          <p className="text-sm text-muted-foreground">{t("carloan.schedule.hint")}</p>
                        </div>
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setShowSchedule((open) => !open)}
                        >
                          {showSchedule ? t("carloan.schedule.hide") : t("carloan.schedule.show")}
                        </Button>
                      </div>
                      {showSchedule && (
                        <div className="mt-4 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="py-2 pr-3 font-medium">{t("carloan.schedule.year")}</th>
                                <th className="py-2 px-3 font-medium text-right">{t("carloan.schedule.principal")}</th>
                                <th className="py-2 px-3 font-medium text-right">{t("carloan.schedule.interest")}</th>
                                <th className="py-2 pl-3 font-medium text-right">{t("carloan.schedule.balance")}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.schedule.map((year) => (
                                <tr key={year.year} className="border-b border-muted last:border-0">
                                  <td className="py-2 pr-3 tabular-nums">{year.year}</td>
                                  <td className="py-2 px-3 text-right tabular-nums">{money(year.principalPaid)}</td>
                                  <td className="py-2 px-3 text-right tabular-nums">{money(year.interestPaid)}</td>
                                  <td className="py-2 pl-3 text-right tabular-nums">{money(year.closingBalance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <RelatedToolsCard currentHref="/car-loan" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
