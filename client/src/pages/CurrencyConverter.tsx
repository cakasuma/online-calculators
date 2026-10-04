import { ArrowLeftRight, ArrowRight, Globe2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";
import { useFxRates } from "@/hooks/use-fx-rates";
import { CalculatorHero } from "@/components/CalculatorHero";
import { RelatedToolsCard } from "@/components/RelatedToolsCard";
import { ShareButton } from "@/components/ShareButton";
import { findRouteByPath } from "@/config/seo";
import { CURRENCY_HUB_PATH, CURRENCY_PAIRS, hasPair, pairPath } from "@/config/currencyPairs";
import { track } from "@/lib/analytics";
import {
  CURRENCIES,
  QUICK_AMOUNTS,
  convert,
  formatMoney,
  formatRate,
  getCurrency,
  getRate,
  isCurrencyCode,
  localeTag,
  parseAmount,
} from "@/lib/currency";
import { mergeFromUrl, numberField, stringField, useUrlSync, type UrlSchema } from "@/lib/urlState";

interface ConverterState {
  amount: number;
  from: string;
  to: string;
}

const DEFAULT_STATE: ConverterState = { amount: 1000, from: "USD", to: "MYR" };

// On the hub page the whole scenario is shareable; on a pair page the path
// already encodes the currencies, so only the amount goes in the query string.
const HUB_SCHEMA: UrlSchema<ConverterState> = {
  amount: numberField("amt"),
  from: stringField("from"),
  to: stringField("to"),
};
const PAIR_SCHEMA: UrlSchema<ConverterState> = { amount: numberField("amt") };

function formatAmountInput(n: number, locale: Parameters<typeof localeTag>[0]): string {
  return n === 0 ? "" : new Intl.NumberFormat(localeTag(locale), { maximumFractionDigits: 6 }).format(n);
}

interface Props {
  /** Fixed currencies for a prerendered pair page (e.g. /currency-converter/usd-to-myr). */
  from?: string;
  to?: string;
  onCalculate?: (expression: string, result: string, url?: string) => void;
}

export default function CurrencyConverter({ from: pairFrom, to: pairTo, onCalculate }: Props = {}) {
  const { t, locale } = useLocale();
  const [location, navigate] = useLocation();
  const { snapshot, status } = useFxRates();
  const isPair = !!pairFrom && !!pairTo;
  const schema = isPair ? PAIR_SCHEMA : HUB_SCHEMA;

  const [initial] = useState<ConverterState>(() => {
    const base: ConverterState = { ...DEFAULT_STATE, ...(isPair ? { from: pairFrom!, to: pairTo!, amount: 100 } : {}) };
    const merged = mergeFromUrl<ConverterState>(base, schema);
    return {
      amount: merged.amount >= 0 ? merged.amount : base.amount,
      from: isCurrencyCode(merged.from) ? merged.from.toUpperCase() : base.from,
      to: isCurrencyCode(merged.to) ? merged.to.toUpperCase() : base.to,
    };
  });

  const [amountInput, setAmountInput] = useState(formatAmountInput(initial.amount, locale));
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);

  const amount = parseAmount(amountInput, locale);
  const state = useMemo<ConverterState>(() => ({ amount, from, to }), [amount, from, to]);
  useUrlSync(state, schema);

  const { rates } = snapshot;
  const rate = getRate(rates, from, to);
  const result = convert(amount, rates, from, to);
  const fromInfo = getCurrency(from)!;
  const toInfo = getCurrency(to)!;

  // On a pair page, picking different currencies moves to that pair's own
  // page (so the URL, title and copy always match what is on screen).
  function changeCurrencies(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (nextFrom === nextTo) return;
    if (isPair || location.startsWith(CURRENCY_HUB_PATH)) {
      if (hasPair(nextFrom, nextTo)) {
        const amt = amount > 0 ? `?amt=${amount}` : "";
        navigate(`${pairPath(nextFrom, nextTo)}${amt}`);
      } else if (isPair) {
        navigate(`${CURRENCY_HUB_PATH}?from=${nextFrom.toLowerCase()}&to=${nextTo.toLowerCase()}${amount > 0 ? `&amt=${amount}` : ""}`);
      }
    }
  }

  function recordConversion() {
    if (amount <= 0 || !Number.isFinite(result)) return;
    track("calculator_complete", { calculator: "currency", from, to, amount: Math.round(amount) });
    onCalculate?.(
      `${formatMoney(amount, from, locale)} → ${to}`,
      formatMoney(result, to, locale),
    );
  }

  const route = findRouteByPath(location.split("?")[0]);
  const heading = route?.copy[locale]?.heading ?? t("currency.title");
  const statusText =
    status === "loading"
      ? t("currency.status.loading")
      : (status === "live" ? t("currency.status.live") : t("currency.status.fallback")).replace(
          "{date}",
          new Intl.DateTimeFormat(localeTag(locale), { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${snapshot.date}T00:00:00Z`)),
        );

  // Internal links: other conversions sharing a currency with this one. Real
  // <a> links between pair pages are what lets crawlers discover and rank them.
  const popular = useMemo(() => {
    const related = CURRENCY_PAIRS.filter(([f, tt]) => (f === from || tt === from || f === to || tt === to) && !(f === from && tt === to));
    return (related.length ? related : CURRENCY_PAIRS).slice(0, 12);
  }, [from, to]);

  const selectClass =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950";

  return (
    <div className="w-full">
      <CalculatorHero
        category="Finance"
        title={heading}
        subtitle={t("currency.subtitle")}
        badges={[t("currency.badge.rates"), t("currency.badge.private")]}
        result={
          <div className="rounded-[20px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur-xl text-white">
            <p className="text-[13px] text-indigo-100">{t("currency.rate")}</p>
            <p className="mt-2 text-2xl md:text-3xl font-bold break-words tabular-nums">
              1 {from} = {formatRate(rate, locale)} {to}
            </p>
            <p className="mt-4 text-[13px] text-white/60">{statusText}</p>
          </div>
        }
      />

      <div className="hk-container py-8 space-y-6 sm:space-y-8 min-w-0">
        <Card className="rounded-2xl sm:rounded-3xl border-slate-200/80 shadow-sm dark:border-slate-800 min-w-0">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div>
              <h2 className="text-xl font-semibold">{t("currency.inputs.title")}</h2>
              <p className="text-sm text-muted-foreground">{t("currency.inputs.subtitle")}</p>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("currency.amount")}</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                onBlur={() => {
                  setAmountInput(formatAmountInput(amount, locale));
                  recordConversion();
                }}
                placeholder="1,000"
                aria-label={t("currency.amount")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-2xl font-semibold tabular-nums shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-800 dark:bg-slate-950"
              />
            </label>

            <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <label className="block space-y-2 min-w-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("currency.from")}</span>
                <select className={selectClass} value={from} onChange={(e) => (e.target.value === to ? changeCurrencies(to, from) : changeCurrencies(e.target.value, to))}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name[locale]}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="mx-auto h-12 w-12 rounded-full"
                aria-label={t("currency.swap")}
                title={t("currency.swap")}
                onClick={() => changeCurrencies(to, from)}
              >
                <ArrowLeftRight className="h-4 w-4 sm:rotate-0 rotate-90" />
              </Button>
              <label className="block space-y-2 min-w-0">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{t("currency.to")}</span>
                <select className={selectClass} value={to} onChange={(e) => (e.target.value === from ? changeCurrencies(to, from) : changeCurrencies(from, e.target.value))}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} — {c.name[locale]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 text-white" aria-live="polite">
              <p className="text-sm text-indigo-100">
                {amount > 0 ? `${formatMoney(amount, from, locale)} =` : t("currency.result")}
              </p>
              <p className="mt-1 text-3xl sm:text-4xl font-bold break-words tabular-nums">{formatMoney(result, to, locale)}</p>
              <p className="mt-3 text-sm text-slate-300 tabular-nums">
                1 {from} = {formatRate(rate, locale)} {to} · 1 {to} = {formatRate(getRate(rates, to, from), locale)} {from}
              </p>
              <p className="mt-1 text-xs text-slate-400">{statusText}</p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground max-w-xl">{t("currency.disclaimer")}</p>
              <ShareButton calculator="currency" state={state} schema={schema} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2 min-w-0">
          <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
            <CardContent className="p-4 sm:p-6">
              <h2 className="text-xl font-semibold">
                {t("currency.quick.title")}: {from} → {to}
              </h2>
              <div className="mt-4 overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">{fromInfo.code}</th>
                      <th className="px-3 py-2 text-right font-semibold">{toInfo.code}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUICK_AMOUNTS.map((amt) => (
                      <tr key={amt} className="border-t">
                        <td className="px-3 py-2 tabular-nums">{formatMoney(amt, from, locale)}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">{formatMoney(amt * rate, to, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl sm:rounded-3xl shadow-sm min-w-0">
            <CardContent className="p-4 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Globe2 className="h-5 w-5 text-primary" />
                {t("currency.popular.title")}
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {popular.map(([f, tt]) => (
                  <li key={`${f}-${tt}`}>
                    <Link href={pairPath(f, tt)}>
                      <span className="group flex items-center justify-between gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm font-medium cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all">
                        <span>
                          {f} → {tt}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              {isPair && (
                <Link href={CURRENCY_HUB_PATH}>
                  <span className="mt-4 inline-block text-sm font-medium text-primary cursor-pointer hover:underline">
                    {t("currency.popular.all")} →
                  </span>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <RelatedToolsCard currentHref={CURRENCY_HUB_PATH} />
      </div>
    </div>
  );
}
