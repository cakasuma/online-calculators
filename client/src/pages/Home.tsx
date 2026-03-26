import { Link } from "wouter";
import { Calculator, FlaskConical, Scale, ArrowRight, BookOpen, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/use-locale";

export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="text-muted-foreground text-base mt-2 leading-relaxed">{t("home.subtitle")}</p>
      </div>

      {/* Featured: Faraid Calculator */}
      <Link href="/faraid">
        <Card className="group hover:border-primary/60 hover:shadow-md transition-all cursor-pointer border-primary/30 bg-primary/5">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Scale className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-semibold">{t("home.faraid.title")}</h2>
                  <Badge className="text-xs px-2 py-0.5">{t("home.faraid.badge")}</Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("home.faraid.desc")}
                </p>
                <div className="mt-4">
                  <Button size="sm" className="gap-2 text-sm pointer-events-none h-9 px-4">
                    Open Calculator
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Featured: Wasiat Guide */}
      <Link href="/wasiat">
        <Card className="group hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                <FileText className="w-7 h-7 text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2 className="text-lg font-semibold">{t("home.wasiat.title")}</h2>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">{t("home.wasiat.badge")}</Badge>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {t("home.wasiat.desc")}
                </p>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="gap-2 text-sm pointer-events-none h-9 px-4 border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                    {t("home.wasiat.cta")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* About Faraid */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 sm:p-5 flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">{t("home.about.title")}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("home.about.text")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Other tools */}
      <div>
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {t("home.tools.title")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: "/normal", icon: Calculator, titleKey: "home.basic.title", descKey: "home.basic.desc" },
            { href: "/scientific", icon: FlaskConical, titleKey: "home.scientific.title", descKey: "home.scientific.desc" },
          ].map(({ href, icon: Icon, titleKey, descKey }) => (
            <Link key={href} href={href}>
              <Card className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold">{t(titleKey as any)}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
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
