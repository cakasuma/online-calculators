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
  const { locale } = useLocale();
  const isId = locale === "id";
  const featured = tools.filter((tool) => tool.featured);

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <section className="rounded-3xl border bg-gradient-to-br from-primary/20 via-background to-sky-500/20 p-6 sm:p-10 shadow-lg">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          {isId ? "Selamat datang di HelloKalku" : "Welcome to HelloKalku"}
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{toolBrand.name}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground leading-relaxed">
          {isId
            ? "Kalkulator dan panduan yang cepat dan praktis untuk keuangan harian, matematika lanjutan, dan perencanaan Islam. Dibuat agar jelas, mendukung dua bahasa (Inggris + Indonesia), dan cepat di perangkat mobile."
            : "Fast, practical calculators and guides for daily finance, advanced math, and Islamic planning. Built for clarity, bilingual usage (English + Indonesian), and mobile-first speed."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/salary">{isId ? "Mulai dari Kalkulator Gaji" : "Start with Salary Calculator"}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/faraid">{isId ? "Buka Kalkulator Faraid" : "Open Faraid Calculator"}</Link></Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">{isId ? "Alat unggulan" : "Featured tools"}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((tool) => (
            <Card key={tool.slug} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold"><tool.icon className="w-4 h-4 text-primary" />{tool.name}</div>
                  {tool.badge ? <Badge>{tool.badge}</Badge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{tool.description}</p>
                <Button asChild variant="ghost" className="px-0"><Link href={tool.href}>Open tool <ArrowRight className="ml-2 w-4 h-4"/></Link></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {grouped.map((group) => (
          <Card key={group.name}><CardContent className="p-5"><h3 className="font-semibold">{group.name}</h3><p className="text-sm text-muted-foreground mt-1">{group.description}</p></CardContent></Card>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">{isId ? "Kenapa HelloKalku?" : "Why HelloKalku?"}</h2>
        <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
          {isId
            ? "HelloKalku dirancang untuk pengguna di Asia Tenggara yang membutuhkan kalkulator tepercaya dengan penjelasan yang jelas, format angka lokal, dan referensi praktis. Baik Anda menghitung gaji bersih, zakat, pembagian faraid, maupun rumus matematika, HelloKalku menjaga antarmuka tetap rapi dan konsisten."
            : "HelloKalku is designed for users in Southeast Asia who need trustworthy calculators with clear explanations, localized numbers, and practical references. Whether you are checking net salary, computing zakat, planning faraid distribution, or solving formulas, HelloKalku keeps the interface clean and consistent."}
        </p>
      </section>

      {adsenseEnabled && adsenseSlotHome ? <AdSlot slot={adsenseSlotHome} className="mx-auto" /> : null}
    </div>
  );
}
