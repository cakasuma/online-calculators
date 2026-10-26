import { ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { RATES_VERIFIED_DATE, RATE_SOURCES, formatVerifiedDate, type RateSourceKey } from "@/lib/sources";

export function RatesVerified({ sources }: { sources: RateSourceKey[] }) {
  const { t, locale } = useLocale();
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground" data-testid="rates-verified">
      <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
      <span>
        {t("rates.verified").replace("{date}", formatVerifiedDate(RATES_VERIFIED_DATE, locale))}
      </span>
      {sources.map((key, i) => (
        <span key={key}>
          <a
            href={RATE_SOURCES[key].url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            {RATE_SOURCES[key].label}
          </a>
          {i < sources.length - 1 ? "," : "."}
        </span>
      ))}
      <Link href="/about" className="underline underline-offset-2 hover:text-foreground">
        {t("rates.methodology")}
      </Link>
    </p>
  );
}
