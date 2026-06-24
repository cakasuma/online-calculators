import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { tools } from "@/config/tools";
import type { TranslationKey } from "@/lib/i18n";

const RELATED: Record<string, string[]> = {
  "/salary":         ["/income-tax", "/epf-retirement"],
  "/epf-retirement": ["/salary", "/fixed-deposit"],
  "/housing-loan":   ["/salary", "/car-loan"],
  "/income-tax":     ["/salary", "/epf-retirement"],
  "/car-loan":       ["/housing-loan", "/salary"],
  "/fixed-deposit":  ["/epf-retirement", "/salary"],
  "/faraid":         ["/wasiat", "/zakat"],
  "/zakat":          ["/faraid", "/salary"],
  "/normal":         ["/scientific"],
  "/scientific":     ["/normal"],
  "/wasiat":         ["/faraid"],
  "/bmi":            ["/salary", "/normal"],
};

interface Props {
  currentHref: string;
}

export function RelatedToolsCard({ currentHref }: Props) {
  const { t } = useLocale();
  const hrefs = RELATED[currentHref] ?? [];
  const related = hrefs
    .map((href) => tools.find((tool) => tool.href === href))
    .filter((tool): tool is NonNullable<typeof tool> => tool != null);

  if (related.length === 0) return null;

  return (
    <Card className="rounded-2xl sm:rounded-3xl border-primary/15 bg-primary/[0.03]">
      <CardContent className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("content.relatedTitle")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {related.map((tool) => (
            <Link key={tool.slug} href={tool.href}>
              <span className="group flex items-start gap-3 rounded-xl border bg-card p-3 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 mt-0.5">
                  <tool.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight line-clamp-1">
                    {t(`tools.${tool.slug}.name` as TranslationKey)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                    {t(`tools.${tool.slug}.desc` as TranslationKey)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-1" />
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
