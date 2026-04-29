import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdSlot } from "@/components/AdSlot";
import { toolBrand, toolCategories, tools } from "@/config/tools";

const grouped = toolCategories.map((category) => ({
  ...category,
  items: tools.filter((tool) => tool.category === category.name),
}));
const adsenseClient = import.meta.env.VITE_ADSENSE_CLIENT?.trim() || "";
const adsenseSlotHome = import.meta.env.VITE_ADSENSE_SLOT_HOME?.trim() || "";
const adsenseEnabled = import.meta.env.PROD && Boolean(adsenseClient);

export default function HomePage() {
  const featured = tools.filter((tool) => tool.featured);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 sm:p-8">
        <Badge className="mb-3" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          Modern utility tools hub
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{toolBrand.name}</h1>
        <p className="text-muted-foreground text-base mt-3 max-w-3xl leading-relaxed">
          Your all-in-one calculator and planning suite for Malaysia. Use finance, math, Islamic, and
          document tools in one fast, mobile-friendly workspace.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Featured tools</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((tool) => (
            <Link key={tool.slug} href={tool.href}>
              <Card className="group h-full cursor-pointer border-primary/20 hover:border-primary/50 hover:shadow-md transition-all">
                <CardContent className="p-5 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <tool.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-lg">{tool.name}</h2>
                      {tool.badge ? <Badge variant="secondary">{tool.badge}</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                    <Button size="sm" className="mt-4 pointer-events-none">
                      Open tool <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Browse by category</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grouped.map((category) => (
            <Card key={category.name} className="h-full">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-xs text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {category.items.map((tool) => (
                    <Link key={tool.slug} href={tool.href}>
                      <div className="rounded-xl border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                        <p className="font-medium text-sm">{tool.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AdSlot id="home-mid-ad" client={adsenseClient} slot={adsenseSlotHome} enabled={adsenseEnabled} />

      <section className="rounded-2xl border p-5 sm:p-6 bg-card">
        <h2 className="text-xl font-semibold">Built by amammustofa</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          This calculator suite is maintained by amammustofa. If you need custom finance tools, calculators, or SEO-ready web
          products for your business, visit my main site.
        </p>
        <div className="mt-4">
          <a
            href="https://amammustofa.com"
            target="_blank"
            rel="noopener noreferrer me"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Visit amammustofa.com <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </div>
  );
}
