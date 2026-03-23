import { Link } from "wouter";
import { Calculator, FlaskConical, Scale, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="text-muted-foreground text-sm mt-2">{t("home.subtitle")}</p>
      </div>

      {/* Featured: Faraid Calculator */}
      <Link href="/faraid">
        <Card className="group hover:border-primary/60 hover:shadow-md transition-all cursor-pointer border-primary/30 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Scale className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold">{t("home.faraid.title")}</h2>
                  <Badge className="text-[10px] px-1.5 py-0">{t("home.faraid.badge")}</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("home.faraid.desc")}
                </p>
                <div className="mt-3">
                  <Button size="sm" className="gap-1.5 text-xs pointer-events-none">
                    {t("home.openCalculator")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* About Faraid */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold mb-1">{t("home.about.title")}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("home.about.text")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Other tools */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          {t("home.tools.title")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { href: "/normal", icon: Calculator, titleKey: "home.basic.title", descKey: "home.basic.desc" },
            { href: "/scientific", icon: FlaskConical, titleKey: "home.scientific.title", descKey: "home.scientific.desc" },
          ].map(({ href, icon: Icon, titleKey, descKey }) => (
            <Link key={href} href={href}>
              <Card className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="p-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xs font-semibold">{t(titleKey as any)}</h2>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {t(descKey as any)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
