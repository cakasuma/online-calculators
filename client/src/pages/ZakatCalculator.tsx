import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "wouter";
import { AlertTriangle, Info, BookOpen, RotateCcw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/hooks/use-locale";
import { AdSlot } from "@/components/AdSlot";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { formatInputValue, formatCurrency, parseLocaleNumber } from "@/lib/i18n";

// ─── Currencies ────────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "MYR", symbol: "RM" },
  { code: "IDR", symbol: "Rp" },
  { code: "USD", symbol: "$" },
  { code: "SAR", symbol: "﷼" },
  { code: "SGD", symbol: "S$" },
  { code: "GBP", symbol: "£" },
];

// Default silver prices per gram by currency (approximate, user should update)
const DEFAULT_SILVER_PRICES: Record<string, string> = {
  MYR: "4.50",
  IDR: "55000",
  USD: "0.95",
  SAR: "3.56",
  SGD: "1.28",
  GBP: "0.75",
};

// Default gold prices per gram by currency (approximate)
const DEFAULT_GOLD_PRICES: Record<string, string> = {
  MYR: "400",
  IDR: "1600000",
  USD: "95",
  SAR: "356",
  SGD: "128",
  GBP: "75",
};

// ─── State ─────────────────────────────────────────────────────────────────────
interface ZakatState {
  currency: string;
  // Cash & Savings
  cashHawl: boolean;
  cashOnHand: string;
  bankSavings: string;
  fixedDeposits: string;
  includeEPF: boolean;
  epfBalance: string;
  // Gold & Silver
  goldHawl: boolean;
  goldGrams: string;
  goldPricePerGram: string;
  silverGrams: string;
  silverPricePerGram: string;
  includeJewelry: boolean;
  // Investments
  investHawl: boolean;
  stocks: string;
  unitTrusts: string;
  includeCrypto: boolean;
  cryptoAmount: string;
  // Business
  businessHawl: boolean;
  inventory: string;
  receivables: string;
  liabilities: string;
  // Rental
  rentalHawl: boolean;
  rentalIncome: string;
  rentalExpenses: string;
}

function makeInitialState(currency = "MYR"): ZakatState {
  return {
    currency,
    cashHawl: true,
    cashOnHand: "",
    bankSavings: "",
    fixedDeposits: "",
    includeEPF: false,
    epfBalance: "",
    goldHawl: true,
    goldGrams: "",
    goldPricePerGram: DEFAULT_GOLD_PRICES[currency] ?? "95",
    silverGrams: "",
    silverPricePerGram: DEFAULT_SILVER_PRICES[currency] ?? "0.95",
    includeJewelry: false,
    investHawl: true,
    stocks: "",
    unitTrusts: "",
    includeCrypto: false,
    cryptoAmount: "",
    businessHawl: true,
    inventory: "",
    receivables: "",
    liabilities: "",
    rentalHawl: true,
    rentalIncome: "",
    rentalExpenses: "",
  };
}

// ─── Helper ─────────────────────────────────────────────────────────────────────
function parseVal(s: string, locale: string): number {
  const n = parseLocaleNumber(s, locale as "en" | "id");
  return isNaN(n) || n < 0 ? 0 : n;
}

// ─── ZakatCalculator ────────────────────────────────────────────────────────────
export default function ZakatCalculator() {
  const { t, locale } = useLocale();
  const [state, setState] = useState<ZakatState>(makeInitialState("MYR"));
  const [livePricesLoading, setLivePricesLoading] = useState(false);
  const [livePricesLoaded, setLivePricesLoaded] = useState(false);
  // Store raw USD spot prices so we can re-convert when currency changes
  const liveUsdPrices = useRef<{ goldUsd: number; silverUsd: number } | null>(null);
  const liveRates = useRef<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLivePricesLoading(true);
    Promise.all([
      fetch("https://api.metals.live/v1/spot").then((r) => r.json()),
      fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json()),
    ])
      .then(([metals, fx]) => {
        if (cancelled) return;
        // metals is an array of single-key objects: [{gold: ...}, {silver: ...}, ...]
        let goldUsd = 0;
        let silverUsd = 0;
        if (Array.isArray(metals)) {
          for (const item of metals) {
            if (item.gold !== undefined) goldUsd = Number(item.gold);
            if (item.silver !== undefined) silverUsd = Number(item.silver);
          }
        }
        const rates: Record<string, number> = fx?.rates ?? {};
        if (goldUsd > 0 && silverUsd > 0) {
          liveUsdPrices.current = { goldUsd, silverUsd };
          liveRates.current = rates;
          setState((prev) => {
            const rate = rates[prev.currency] ?? 1;
            // troy oz → grams: 1 troy oz = 31.1035 g
            const goldPerGram = (goldUsd / 31.1035) * rate;
            const silverPerGram = (silverUsd / 31.1035) * rate;
            return {
              ...prev,
              goldPricePerGram: goldPerGram.toFixed(2),
              silverPricePerGram: silverPerGram.toFixed(4),
            };
          });
          setLivePricesLoaded(true);
        }
      })
      .catch(() => {
        // silently fall back to static defaults
      })
      .finally(() => {
        if (!cancelled) setLivePricesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function set<K extends keyof ZakatState>(key: K, value: ZakatState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleNumericInput(key: keyof ZakatState, raw: string) {
    set(key, formatInputValue(raw, locale) as ZakatState[typeof key]);
  }

  function handleCurrencyChange(code: string) {
    setState((prev) => {
      // If we have live prices, re-convert to the new currency
      if (liveUsdPrices.current && liveRates.current) {
        const rate = liveRates.current[code] ?? 1;
        const goldPerGram = (liveUsdPrices.current.goldUsd / 31.1035) * rate;
        const silverPerGram = (liveUsdPrices.current.silverUsd / 31.1035) * rate;
        return {
          ...prev,
          currency: code,
          goldPricePerGram: goldPerGram.toFixed(2),
          silverPricePerGram: silverPerGram.toFixed(4),
        };
      }
      return {
        ...prev,
        currency: code,
        goldPricePerGram: DEFAULT_GOLD_PRICES[code] ?? prev.goldPricePerGram,
        silverPricePerGram: DEFAULT_SILVER_PRICES[code] ?? prev.silverPricePerGram,
      };
    });
  }

  // ─── Computation ─────────────────────────────────────────────────────────────
  const result = useMemo(() => {
    const p = (s: string) => parseVal(s, locale);

    const silverPPG = p(state.silverPricePerGram);
    const nisab = 595 * silverPPG;

    // Cash
    const cashTotal =
      p(state.cashOnHand) +
      p(state.bankSavings) +
      p(state.fixedDeposits) +
      (state.includeEPF ? p(state.epfBalance) : 0);
    const cashZakatable = state.cashHawl ? cashTotal : 0;

    // Gold & Silver
    const goldValue = p(state.goldGrams) * p(state.goldPricePerGram);
    const silverValue = p(state.silverGrams) * p(state.silverPricePerGram);
    const goldSilverTotal = goldValue + silverValue;
    const goldSilverZakatable = state.goldHawl ? goldSilverTotal : 0;

    // Investments
    const investTotal =
      p(state.stocks) +
      p(state.unitTrusts) +
      (state.includeCrypto ? p(state.cryptoAmount) : 0);
    const investZakatable = state.investHawl ? investTotal : 0;

    // Business
    const businessNet = Math.max(
      0,
      p(state.inventory) + p(state.receivables) - p(state.liabilities)
    );
    const businessZakatable = state.businessHawl ? businessNet : 0;

    // Rental
    const rentalNet = Math.max(0, p(state.rentalIncome) - p(state.rentalExpenses));
    const rentalZakatable = state.rentalHawl ? rentalNet : 0;

    const total =
      cashZakatable +
      goldSilverZakatable +
      investZakatable +
      businessZakatable +
      rentalZakatable;

    const zakatDue = total >= nisab && nisab > 0 ? total * 0.025 : 0;
    const percentOfNisab = nisab > 0 ? total / nisab : 0;

    return {
      nisab,
      cashZakatable,
      goldSilverZakatable,
      investZakatable,
      businessZakatable,
      rentalZakatable,
      total,
      zakatDue,
      percentOfNisab,
      silverPPG,
    };
  }, [state, locale]);

  const currSym = CURRENCIES.find((c) => c.code === state.currency)?.symbol ?? "";

  // ─── Status colour ────────────────────────────────────────────────────────────
  const { percentOfNisab, zakatDue, nisab, total } = result;
  const isAbove = zakatDue > 0;
  const isClose = !isAbove && percentOfNisab >= 0.8 && nisab > 0;
  const summaryColor = isAbove
    ? "border-green-500/40 bg-green-50/60 dark:bg-green-950/30"
    : isClose
    ? "border-amber-500/40 bg-amber-50/60 dark:bg-amber-950/30"
    : "border-muted";
  const zakatTextColor = isAbove
    ? "text-green-700 dark:text-green-400"
    : isClose
    ? "text-amber-700 dark:text-amber-400"
    : "text-muted-foreground";

  // ─── Shared field renderer ────────────────────────────────────────────────────
  function NumField({
    label,
    help,
    fieldKey,
    placeholder,
  }: {
    label: string;
    help: string;
    fieldKey: keyof ZakatState;
    placeholder?: string;
  }) {
    return (
      <div className="space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
            {currSym}
          </span>
          <Input
            type="text"
            inputMode="decimal"
            value={state[fieldKey] as string}
            onChange={(e) => handleNumericInput(fieldKey, e.target.value)}
            placeholder={placeholder ?? "0"}
            className="pl-9"
          />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{help}</p>
      </div>
    );
  }

  function HawlToggle({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) {
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-muted">
        <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
        <div>
          <p className="text-sm font-medium">{t("zakat.hawl.label")}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("zakat.hawl.help")}
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("zakat.title")}</h1>
          <Badge variant="secondary" className="text-xs">
            {t("home.zakat.badge")}
          </Badge>
        </div>
        <p className="text-muted-foreground text-base leading-relaxed">{t("zakat.subtitle")}</p>
      </div>

      {/* Disclaimer */}
      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-0.5">
              {t("zakat.disclaimer.title")}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
              {t("zakat.disclaimer.text")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Currency selector — only */}
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{t("zakat.currency")}</Label>
            <select
              value={state.currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Nisab Threshold card */}
      <Card className="border-teal-400/40 bg-teal-50/60 dark:bg-teal-950/20">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">📏</span>
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">Nisab Threshold</p>
          </div>
          {/* Silver price input */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">{t("zakat.silverPrice.label")}</Label>
              {livePricesLoading && (
                <span className="text-xs text-muted-foreground animate-pulse">Fetching live prices…</span>
              )}
              {livePricesLoaded && !livePricesLoading && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">🔄 Live</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                {currSym}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={state.silverPricePerGram}
                onChange={(e) =>
                  set("silverPricePerGram", formatInputValue(e.target.value, locale))
                }
                className="pl-9 bg-white/70 dark:bg-white/5"
                placeholder="0.95"
              />
            </div>
            <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed">
              Nisab = 595 g of silver. Enter the current silver price per gram to calculate the Nisab threshold for your currency.
            </p>
          </div>
          {/* Nisab preview */}
          {result.nisab > 0 && (
            <div className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300 bg-teal-100/60 dark:bg-teal-900/30 rounded-lg px-3 py-2">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>
                {t("zakat.summary.nisab")}:{" "}
                <span className="font-semibold">
                  {currSym} {formatCurrency(result.nisab, locale)}
                </span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <AdSlot id="zakat-top" variant="banner" />

      {/* Accordion Categories */}
      <Accordion type="multiple" defaultValue={["cash", "gold"]} className="space-y-3">
        {/* ── Cash & Savings ── */}
        <AccordionItem value="cash" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t("zakat.category.cashSavings")}</p>
                  {result.cashZakatable > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currSym} {formatCurrency(result.cashZakatable, locale)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
            <HawlToggle
              checked={state.cashHawl}
              onChange={(v) => set("cashHawl", v)}
            />
            <NumField
              label={t("zakat.cash.onHand")}
              help={t("zakat.cash.onHand.help")}
              fieldKey="cashOnHand"
            />
            <NumField
              label={t("zakat.cash.bankSavings")}
              help={t("zakat.cash.bankSavings.help")}
              fieldKey="bankSavings"
            />
            <NumField
              label={t("zakat.cash.fixedDeposits")}
              help={t("zakat.cash.fixedDeposits.help")}
              fieldKey="fixedDeposits"
            />
            {/* EPF toggle */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Switch
                  checked={state.includeEPF}
                  onCheckedChange={(v) => set("includeEPF", v)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{t("zakat.cash.epf")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("zakat.cash.epf.help")}
                  </p>
                </div>
              </div>
              {state.includeEPF && (
                <NumField
                  label={t("zakat.cash.epfAmount")}
                  help=""
                  fieldKey="epfBalance"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Gold & Silver ── */}
        <AccordionItem value="gold" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/15 flex items-center justify-center">
                  <span className="text-lg">🥇</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t("zakat.category.goldSilver")}</p>
                  {result.goldSilverZakatable > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currSym} {formatCurrency(result.goldSilverZakatable, locale)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
            <HawlToggle
              checked={state.goldHawl}
              onChange={(v) => set("goldHawl", v)}
            />
            {/* Jewelry toggle */}
            <div className="flex items-start gap-3">
              <Switch
                checked={state.includeJewelry}
                onCheckedChange={(v) => set("includeJewelry", v)}
                className="mt-0.5"
              />
              <div>
                <p className="text-sm font-medium">{t("zakat.gold.jewelry")}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t("zakat.gold.jewelry.help")}
                </p>
              </div>
            </div>
            {/* Gold */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{t("zakat.gold.goldGrams")}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={state.goldGrams}
                  onChange={(e) => handleNumericInput("goldGrams", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">{t("zakat.gold.goldGrams.help")}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">{t("zakat.gold.goldPrice")}</Label>
                  {livePricesLoading && (
                    <span className="text-xs text-muted-foreground animate-pulse">Fetching live prices…</span>
                  )}
                  {livePricesLoaded && !livePricesLoading && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">🔄 Live</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                    {currSym}
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={state.goldPricePerGram}
                    onChange={(e) =>
                      set("goldPricePerGram", formatInputValue(e.target.value, locale))
                    }
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("zakat.gold.goldPrice.help")}</p>
              </div>
            </div>
            {/* Gold value preview */}
            {parseVal(state.goldGrams, locale) > 0 && parseVal(state.goldPricePerGram, locale) > 0 && (
              <p className="text-xs text-muted-foreground pl-1">
                Gold value: {currSym}{" "}
                {formatCurrency(
                  parseVal(state.goldGrams, locale) * parseVal(state.goldPricePerGram, locale),
                  locale
                )}
              </p>
            )}
            {/* Silver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{t("zakat.gold.silverGrams")}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={state.silverGrams}
                  onChange={(e) => handleNumericInput("silverGrams", e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">{t("zakat.gold.silverGrams.help")}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Label className="text-sm font-medium">{t("zakat.silverPrice.label")}</Label>
                  {livePricesLoading && (
                    <span className="text-xs text-muted-foreground animate-pulse">…</span>
                  )}
                  {livePricesLoaded && !livePricesLoading && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">🔄 Live</span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                    {currSym}
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={state.silverPricePerGram}
                    onChange={(e) =>
                      set("silverPricePerGram", formatInputValue(e.target.value, locale))
                    }
                    className="pl-9"
                    placeholder="0.95"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t("zakat.gold.goldPrice.help")}</p>
              </div>
            </div>
            {/* Silver value preview */}
            {parseVal(state.silverGrams, locale) > 0 && parseVal(state.silverPricePerGram, locale) > 0 && (
              <p className="text-xs text-muted-foreground pl-1">
                Silver value: {currSym}{" "}
                {formatCurrency(
                  parseVal(state.silverGrams, locale) * parseVal(state.silverPricePerGram, locale),
                  locale
                )}
              </p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ── Investments ── */}
        <AccordionItem value="investments" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t("zakat.category.investments")}</p>
                  {result.investZakatable > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currSym} {formatCurrency(result.investZakatable, locale)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
            <HawlToggle
              checked={state.investHawl}
              onChange={(v) => set("investHawl", v)}
            />
            <NumField
              label={t("zakat.investments.stocks")}
              help={t("zakat.investments.stocks.help")}
              fieldKey="stocks"
            />
            <NumField
              label={t("zakat.investments.unitTrusts")}
              help={t("zakat.investments.unitTrusts.help")}
              fieldKey="unitTrusts"
            />
            {/* Crypto toggle */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Switch
                  checked={state.includeCrypto}
                  onCheckedChange={(v) => set("includeCrypto", v)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">{t("zakat.investments.crypto")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {t("zakat.investments.crypto.help")}
                  </p>
                </div>
              </div>
              {state.includeCrypto && (
                <NumField
                  label={t("zakat.investments.cryptoAmount")}
                  help=""
                  fieldKey="cryptoAmount"
                />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ── Business Assets ── */}
        <AccordionItem value="business" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <span className="text-lg">🏪</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t("zakat.category.business")}</p>
                  {result.businessZakatable > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currSym} {formatCurrency(result.businessZakatable, locale)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
            <HawlToggle
              checked={state.businessHawl}
              onChange={(v) => set("businessHawl", v)}
            />
            <NumField
              label={t("zakat.business.inventory")}
              help={t("zakat.business.inventory.help")}
              fieldKey="inventory"
            />
            <NumField
              label={t("zakat.business.receivables")}
              help={t("zakat.business.receivables.help")}
              fieldKey="receivables"
            />
            <NumField
              label={t("zakat.business.liabilities")}
              help={t("zakat.business.liabilities.help")}
              fieldKey="liabilities"
            />
          </AccordionContent>
        </AccordionItem>

        {/* ── Rental Income ── */}
        <AccordionItem value="rental" className="border rounded-xl overflow-hidden">
          <AccordionTrigger className="px-4 sm:px-5 py-4 hover:no-underline hover:bg-muted/30 [&>svg]:hidden">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-500/15 flex items-center justify-center">
                  <span className="text-lg">🏠</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t("zakat.category.rental")}</p>
                  {result.rentalZakatable > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {currSym} {formatCurrency(result.rentalZakatable, locale)}
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 sm:px-5 pb-5 space-y-4">
            <HawlToggle
              checked={state.rentalHawl}
              onChange={(v) => set("rentalHawl", v)}
            />
            <NumField
              label={t("zakat.rental.annualIncome")}
              help={t("zakat.rental.annualIncome.help")}
              fieldKey="rentalIncome"
            />
            <NumField
              label={t("zakat.rental.expenses")}
              help={t("zakat.rental.expenses.help")}
              fieldKey="rentalExpenses"
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AdSlot id="zakat-mid" variant="rectangle" />

      {/* ── Summary Card ── */}
      <Card className={`border-2 transition-colors ${summaryColor}`}>
        <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
          <CardTitle className="text-lg">{t("zakat.summary.title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-5 pb-5 space-y-4">
          {/* Breakdown table */}
          <div className="space-y-2">
            {[
              { label: t("zakat.breakdown.cash"), value: result.cashZakatable },
              { label: t("zakat.breakdown.gold"), value: result.goldSilverZakatable },
              { label: t("zakat.breakdown.invest"), value: result.investZakatable },
              { label: t("zakat.breakdown.business"), value: result.businessZakatable },
              { label: t("zakat.breakdown.rental"), value: result.rentalZakatable },
            ]
              .filter((row) => row.value > 0)
              .map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium tabular-nums">
                    {currSym} {formatCurrency(row.value, locale)}
                  </span>
                </div>
              ))}
            {result.total === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Fill in your assets above to see the breakdown.
              </p>
            )}
          </div>

          {result.total > 0 && <div className="border-t" />}

          {/* Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("zakat.summary.totalZakatable")}</span>
              <span className="font-semibold tabular-nums">
                {currSym} {formatCurrency(result.total, locale)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("zakat.summary.nisab")}</span>
              <span className="font-medium tabular-nums">
                {result.nisab > 0
                  ? `${currSym} ${formatCurrency(result.nisab, locale)}`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Nisab bar */}
          {result.nisab > 0 && result.total > 0 && (
            <div className="space-y-1">
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isAbove
                      ? "bg-green-500"
                      : isClose
                      ? "bg-amber-500"
                      : "bg-muted-foreground/40"
                  }`}
                  style={{ width: `${Math.min(100, percentOfNisab * 100).toFixed(1)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">
                {(percentOfNisab * 100).toFixed(1)}% of Nisab
              </p>
            </div>
          )}

          {/* Zakat due */}
          <div className="rounded-xl border p-4 text-center space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {t("zakat.summary.zakatDue")}
            </p>
            <p className={`text-3xl font-bold tabular-nums ${zakatTextColor}`}>
              {result.nisab === 0
                ? "—"
                : `${currSym} ${formatCurrency(zakatDue, locale)}`}
            </p>
            <p className={`text-sm font-medium ${zakatTextColor}`}>
              {result.nisab === 0
                ? "Enter silver price above"
                : isAbove
                ? t("zakat.summary.aboveNisab")
                : isClose
                ? t("zakat.summary.closeToNisab")
                : t("zakat.summary.belowNisab")}
            </p>
          </div>

          {/* Reset */}
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
            onClick={() => setState(makeInitialState(state.currency))}
          >
            <RotateCcw className="w-4 h-4" />
            {t("zakat.reset")}
          </Button>
        </CardContent>
      </Card>

      <AdSlot id="zakat-bottom" variant="banner" />

      {/* About Nisab & Hawl */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">{t("zakat.nisab.title")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("zakat.nisab.text")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Back to home */}
      <div className="pb-4">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-muted-foreground gap-2">
            ← Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
