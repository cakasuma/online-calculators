import { Link } from "wouter";
import { useLocale } from "@/hooks/use-locale";
import { getCalculatorContent } from "@/config/content";
import { findRouteBySlug, type RouteSlug } from "@/config/seo";
import { tools } from "@/config/tools";
import type { TranslationKey } from "@/lib/i18n";

interface Props {
  slug: RouteSlug;
}

export function CalculatorContent({ slug }: Props) {
  const { locale, t } = useLocale();
  const content = getCalculatorContent(slug, locale);
  if (!content) return null;

  const related = content.related
    .map((s) => {
      const route = findRouteBySlug(s);
      const tool = tools.find((tt) => tt.href === route?.path);
      if (!route || !tool) return null;
      // Use the localised tool name / description from i18n when available;
      // fall back to the hardcoded English in tools.ts so adding a new tool
      // without translations still renders something.
      const name = t(`tools.${tool.slug}.name` as TranslationKey) || tool.name;
      const description = t(`tools.${tool.slug}.desc` as TranslationKey) || tool.description;
      return { slug: s, name, href: route.path, description };
    })
    .filter((x): x is { slug: RouteSlug; name: string; href: string; description: string } => x !== null);

  return (
    <section className="mt-10 max-w-3xl mx-auto" data-prerender-content={slug}>
      <p className="text-base leading-relaxed text-muted-foreground">{content.intro}</p>

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">{content.howItWorks.heading}</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
          {content.howItWorks.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>

      {content.formula && (
        <div className="mt-8 rounded-xl border bg-muted/30 p-5">
          <h2 className="text-lg font-semibold tracking-tight">{content.formula.heading}</h2>
          <div className="mt-3 space-y-2 text-sm leading-relaxed">
            {content.formula.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </div>
      )}

      {content.rateTable && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">{content.rateTable.heading}</h2>
          {content.rateTable.caption && (
            <p className="mt-2 text-sm text-muted-foreground">{content.rateTable.caption}</p>
          )}
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {content.rateTable.columns.map((col, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.rateTable.rows.map((row, ri) => (
                  <tr key={ri} className="border-t">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {content.rateTable.note && (
            <p className="mt-2 text-xs text-muted-foreground">{content.rateTable.note}</p>
          )}
        </div>
      )}

      {content.examples && content.examples.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold tracking-tight">{t("content.workedExamples")}</h2>
          <div className="mt-3 grid gap-3">
            {content.examples.map((ex, i) => (
              <div key={i} className="rounded-lg border p-4">
                <h3 className="text-sm font-semibold">{ex.title}</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-0.5">
                  {ex.given.map((g, gi) => (
                    <li key={gi}>{g}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">
                  <span className="font-medium">{t("content.resultLabel")}</span>
                  {ex.result}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-semibold tracking-tight">{t("content.faqTitle")}</h2>
        <dl className="mt-3 space-y-4">
          {content.faq.map((item, i) => (
            <div key={i}>
              <dt className="text-sm font-semibold">{item.question}</dt>
              <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>

      {related.length > 0 && (
        <div className="mt-10 border-t pt-6">
          <h2 className="text-base font-semibold tracking-tight">{t("content.relatedTitle")}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {related.map((r) => (
              <Link key={r.slug} href={r.href}>
                <span className="group block rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer">
                  <span className="block text-sm font-medium group-hover:text-primary">{r.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground line-clamp-2">{r.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {content.lastReviewed && (
        <p className="mt-8 text-xs text-muted-foreground">
          {t("content.lastReviewed")}
          {content.lastReviewed}
        </p>
      )}
    </section>
  );
}
