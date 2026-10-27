import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocale } from "@/hooks/use-locale";
import { track } from "@/lib/analytics";

export interface WhatNextItem {
  href: string;
  title: string;
  description: string;
  target: string;
}

export function WhatNext({ from, items }: { from: string; items: WhatNextItem[] }) {
  const { t } = useLocale();
  return (
    <Card className="rounded-2xl sm:rounded-3xl border-primary/20 bg-primary/[0.04]" data-testid="what-next">
      <CardContent className="p-4 sm:p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("whatnext.title")}
        </p>
        <div className="grid gap-2">
          {items.map((item) => (
            <Link
              key={item.target}
              href={item.href}
              onClick={() => track("what_next_click", { from, to: item.target })}
            >
              <span className="group flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold leading-tight">{item.title}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.description}</span>
                </span>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-primary" />
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
