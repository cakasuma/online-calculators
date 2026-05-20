import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, toolCategories, tools } from "@/config/tools";
import { useLocale } from "@/hooks/use-locale";

const grouped = toolCategories.map((category) => ({
  ...category,
  items: tools.filter((tool) => tool.category === category.name),
}));
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

export default function HomePage() {
  const { t } = useLocale();
  const featured = tools.filter((tool) => tool.featured);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/20 via-background to-sky-500/20 p-6 sm:p-10 shadow-lg">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {t("home.hero.badge")}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{toolBrand.name}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
          {t("home.hero.subtitle")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/salary">{t("home.hero.ctaSalary")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/faraid">{t("home.hero.ctaFaraid")}</Link></Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          <Link href="/partners" className="hover:text-foreground underline-offset-2 hover:underline">
            {t("home.hero.partnersLink")}
          </Link>
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{t("home.featured.title")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((tool) => (
            <Card key={tool.slug} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold"><tool.icon className="w-4 h-4 text-primary" />{t(`tools.${tool.slug}.name` as any)}</div>
                  {tool.badge ? <Badge>{t(`tools.${tool.slug}.badge` as any)}</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{t(`tools.${tool.slug}.desc` as any)}</p>
                <Button asChild variant="ghost" className="px-0"><Link href={tool.href}>{t("home.featured.openTool")} <ArrowRight className="ml-2 w-4 h-4"/></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {grouped.map((group) => (
          <Card key={group.name}><CardContent className="p-5"><h3 className="font-semibold">{t(`home.category.${group.name}.name` as any)}</h3><p className="text-sm text-muted-foreground mt-1">{t(`home.category.${group.name}.desc` as any)}</p></CardContent></Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{t("home.why.title")}</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          {t("home.why.body")}
        </p>
      </section>

      {adsenseEnabled && adsenseSlotHome ? <AdSlot slot={adsenseSlotHome} className="mx-auto" /> : null}
    </div>
  );
}
