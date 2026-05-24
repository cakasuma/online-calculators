import { Link } from "wouter";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { tools } from "@/config/tools";
import type { TranslationKey } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useLocale();

  const suggestedTools = tools.filter((tool) => tool.featured).slice(0, 4);
  const displayTools = suggestedTools.length >= 2 ? suggestedTools : tools.slice(0, 4);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-10 text-center">
      <div
        className="text-8xl font-bold text-muted-foreground/10 select-none leading-none mb-4"
        aria-hidden="true"
      >
        404
      </div>

      <h1 className="text-2xl font-bold mb-2">{t("notFound.title")}</h1>
      <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
        {t("notFound.message")}
      </p>

      <Button asChild size="lg" className="gap-2 mb-10 rounded-2xl">
        <Link href="/">
          <Home className="w-4 h-4" />
          {t("nav.home")}
        </Link>
      </Button>

      <div className="w-full max-w-xl text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 text-center">
          {t("home.featured.openTool")} a tool
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {displayTools.map((tool) => (
            <Link key={tool.slug} href={tool.href}>
              <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0 mt-0.5">
                    <tool.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-tight">
                      {t(`tools.${tool.slug}.name` as TranslationKey)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
                      {t(`tools.${tool.slug}.desc` as TranslationKey)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
