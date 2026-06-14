import { Link } from "wouter";
import { blogArticles } from "@/config/blog";
import { Clock, BookOpen, ArrowRight, Wallet, PiggyBank, Scale } from "lucide-react";

type LucideIcon = typeof Wallet;

const CATEGORY_COLORS: Record<string, string> = {
  "Salary & Tax": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "EPF & Retirement": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Islamic Finance": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const GUIDE_THUMBNAILS: Record<string, { icon: LucideIcon; gradient: string; iconColor: string }> = {
  "Salary & Tax": {
    icon: Wallet,
    gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  "EPF & Retirement": {
    icon: PiggyBank,
    gradient: "from-green-500/20 via-green-400/10 to-transparent",
    iconColor: "text-green-600 dark:text-green-400",
  },
  "Islamic Finance": {
    icon: Scale,
    gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
};

export default function Blog() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="w-4 h-4" />
          <span>Guides & Education</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Calculator Guides &amp; Financial Education</h1>
        <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
          In-depth guides on Malaysian financial planning, Islamic finance, salary deductions, EPF, zakat, faraid, and more. Written to help you understand the numbers behind the calculators.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {blogArticles.map((article) => {
          const categoryColor = CATEGORY_COLORS[article.categoryLabel] ?? "bg-muted text-muted-foreground";
          const thumb = GUIDE_THUMBNAILS[article.categoryLabel];
          const ThumbIcon = thumb?.icon ?? BookOpen;

          return (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <article className="group flex flex-col rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full overflow-hidden">
                {/* Thumbnail header */}
                <div className={`relative flex items-center justify-center h-28 bg-gradient-to-br ${thumb?.gradient ?? "from-muted/60 to-transparent"} border-b border-border/50 overflow-hidden`}>
                  <ThumbIcon className={`absolute w-28 h-28 ${thumb?.iconColor ?? "text-muted-foreground"} opacity-[0.07] -rotate-6 translate-x-10`} aria-hidden="true" />
                  <div className="relative z-10 flex items-center justify-center w-11 h-11 rounded-xl bg-background/70 backdrop-blur-sm border border-border/60 shadow-sm">
                    <ThumbIcon className={`w-5 h-5 ${thumb?.iconColor ?? "text-muted-foreground"}`} />
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 p-4 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
                      {article.categoryLabel}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Clock className="w-3 h-3" />
                      {article.readingTime} min read
                    </span>
                  </div>

                  <h2 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {article.title}
                  </h2>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
                    {article.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto pt-1">
                    <time className="text-xs text-muted-foreground" dateTime={article.publishedDate}>
                      {new Date(article.publishedDate).toLocaleDateString("en-MY", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                    <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Read guide
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>

      <footer className="border-t pt-6 text-sm text-muted-foreground space-y-1">
        <p>
          All guides are written for informational purposes only and do not constitute financial, legal, or religious advice. For personalised advice, consult a licensed financial planner, tax professional, or Islamic scholar.
        </p>
        <p>
          Contribution rates and tax brackets reflect the 2026 year of assessment. Verify current figures with official sources: KWSP, LHDN, PERKESO, and your state's zakat authority.
        </p>
      </footer>
    </div>
  );
}
