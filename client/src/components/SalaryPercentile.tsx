import { useEffect, useState } from "react";
import { Users, TrendingUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { formatCurrency } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { INCOME_BRACKETS, bracketForIncome } from "@/lib/salaryBrackets";

interface Breakpoint {
  p: number;
  value: number;
}

interface ApiResponse {
  available: boolean;
  sampleSize?: number;
  windowStart?: number;
  breakpoints?: Breakpoint[];
}

interface Props {
  monthlyGross: number;
}

// Cache the API response in module scope so navigating between calculators in
// the SPA does not re-fetch unnecessarily. The endpoint itself sets a long
// Cache-Control too.
let cachedPromise: Promise<ApiResponse> | null = null;
function fetchDistribution(): Promise<ApiResponse> {
  if (cachedPromise) return cachedPromise;
  cachedPromise = fetch("/api/salary-percentile")
    .then((r) => (r.ok ? r.json() : { available: false }))
    .catch(() => ({ available: false }));
  return cachedPromise;
}

function percentileOfValue(value: number, breakpoints: Breakpoint[]): number {
  // Breakpoints come sorted ascending by p. Find adjacent breakpoints and
  // linearly interpolate. value below P10 → return <10; above P99 → return >99.
  if (breakpoints.length === 0) return 50;
  if (value <= breakpoints[0].value) return Math.max(1, Math.round(breakpoints[0].p * (value / breakpoints[0].value)));
  for (let i = 1; i < breakpoints.length; i++) {
    const lo = breakpoints[i - 1];
    const hi = breakpoints[i];
    if (value <= hi.value) {
      const frac = (value - lo.value) / Math.max(1, hi.value - lo.value);
      return Math.round(lo.p + frac * (hi.p - lo.p));
    }
  }
  return 99;
}

export function SalaryPercentile({ monthlyGross }: Props) {
  const { t, locale } = useLocale();
  const [dist, setDist] = useState<ApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDistribution().then((r) => {
      if (!cancelled) setDist(r);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (monthlyGross <= 0) return null;

  const bracket = bracketForIncome(monthlyGross);

  // Where does the user sit in the bracket range? Used for the inline marker.
  const bracketMin = bracket.min;
  const bracketMax = bracket.max === Infinity ? bracketMin * 2 : bracket.max;
  const positionPct = Math.min(
    100,
    Math.max(0, ((monthlyGross - bracketMin) / Math.max(1, bracketMax - bracketMin)) * 100),
  );

  const submissionPctile = dist?.available && dist.breakpoints
    ? percentileOfValue(monthlyGross, dist.breakpoints)
    : null;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">{t("salary.percentile.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("salary.percentile.subtitle")}
            </p>
          </div>
        </div>

        {/* DOSM bracket */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("salary.percentile.malaysiaBracket")}
              </p>
              <p className="text-2xl font-bold mt-0.5">
                {bracket.key}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {t(bracket.labelKey as TranslationKey)}
                </span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {bracketMin === 0
                ? `≤ RM ${formatCurrency(bracket.max, locale)}`
                : bracket.max === Infinity
                  ? `≥ RM ${formatCurrency(bracket.min, locale)}`
                  : `RM ${formatCurrency(bracket.min, locale)} – RM ${formatCurrency(bracket.max, locale)}`}
            </p>
          </div>

          {/* Visual bracket strip */}
          <div className="relative h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute top-0 h-full bg-primary/70"
              style={{ width: `${positionPct}%` }}
            />
            <div
              className="absolute top-[-4px] h-4 w-0.5 bg-foreground"
              style={{ left: `${positionPct}%` }}
              aria-hidden="true"
            />
          </div>

          {/* Bracket key row */}
          <div className="flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground pt-1">
            {INCOME_BRACKETS.map((b) => (
              <span
                key={b.key}
                className={b.key === bracket.key ? "text-primary font-semibold" : ""}
              >
                {b.key}
              </span>
            ))}
          </div>
        </div>

        {/* Submission-based percentile */}
        <div className="border-t pt-4">
          {submissionPctile != null && dist?.sampleSize ? (
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {t("salary.percentile.amongUsers")
                    .replace("{percentile}", String(100 - submissionPctile))
                    .replace("{sampleSize}", dist.sampleSize.toLocaleString(locale === "id" ? "id-ID" : "en-US"))}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("salary.percentile.windowNote")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 text-muted-foreground">
              <div className="rounded-xl bg-muted p-2.5">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm">{t("salary.percentile.notEnoughData")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Caveat */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
          <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <p>{t("salary.percentile.householdNote")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
