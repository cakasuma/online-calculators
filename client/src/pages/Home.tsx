import { Link } from "wouter";
import { Calculator, FlaskConical, Scale, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";

const calculators = [
  {
    href: "/normal",
    icon: Calculator,
    titleKey: "home.basic.title",
    descKey: "home.basic.desc",
  },
  {
    href: "/scientific",
    icon: FlaskConical,
    titleKey: "home.scientific.title",
    descKey: "home.scientific.desc",
  },
  {
    href: "/faraid",
    icon: Scale,
    titleKey: "home.faraid.title",
    descKey: "home.faraid.desc",
  },
] as const;

export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("home.title")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("home.subtitle")}</p>
      </div>

      <div className="grid gap-3">
        {calculators.map(({ href, icon: Icon, titleKey, descKey }) => (
          <Link key={href} href={href}>
            <Card className="group hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-semibold">{t(titleKey)}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t(descKey)}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
