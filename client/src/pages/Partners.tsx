import { useEffect, useState } from "react";
import { ExternalLink, Globe, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { findRouteBySlug, canonicalUrl, SITE_ORIGIN } from "@/config/seo";

interface EmbedHost {
  host: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

interface ApiResponse {
  totalHosts: number;
  totalEmbedViews: number;
  hosts: EmbedHost[];
}

export default function Partners() {
  const { t, locale } = useLocale();
  const route = findRouteBySlug("partners");
  const copy = route?.copy[locale] ?? route?.copy.en;
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/embed-hosts")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
      .then((d: ApiResponse) => setData(d))
      .catch(() => setError(true));
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy?.heading}</h1>
        {copy?.tagline && <p className="text-base text-muted-foreground">{copy.tagline}</p>}
      </header>

      {/* Top-line stats */}
      <div className="grid sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("partners.stat.sites")}
            </p>
            <p className="mt-1 text-3xl font-bold">
              {data ? data.totalHosts.toLocaleString() : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("partners.stat.views")}
            </p>
            <p className="mt-1 text-3xl font-bold">
              {data ? data.totalEmbedViews.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("partners.stat.windowNote")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("partners.stat.calculators")}
            </p>
            <p className="mt-1 text-3xl font-bold">5</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("partners.stat.calcList")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Embed pitch */}
      <Card className="border-primary/30 bg-primary/[0.04]">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="rounded-2xl bg-primary/15 p-3 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-lg font-semibold">{t("partners.pitch.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("partners.pitch.body")}</p>
            <p className="text-xs text-muted-foreground">{t("partners.pitch.cta")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Host list */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("partners.list.title")}</h2>
        {error ? (
          <p className="text-sm text-muted-foreground">{t("partners.list.error")}</p>
        ) : !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t("partners.list.loading")}</span>
          </div>
        ) : data.hosts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center space-y-2 text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm">{t("partners.list.empty")}</p>
              <p className="text-xs">{t("partners.list.emptyHint")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2">
            {data.hosts.map((h) => (
              <a
                key={h.host}
                href={`https://${h.host}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/50 hover:bg-muted/40"
                data-testid={`partner-${h.host}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-primary">{h.host}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.count.toLocaleString()} {t("partners.embedViews")}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground pt-1">{t("partners.list.disclosure")}</p>
      </section>
    </div>
  );
}

// Hint canonical for the prerender (not strictly needed; seo.ts handles it).
export const PARTNERS_CANONICAL = canonicalUrl("en", "/partners");
export const PARTNERS_ORIGIN = SITE_ORIGIN;
