import type { Locale } from "../lib/i18n";
import type { RouteSeoEntry } from "./seo";
import { blogArticles } from "./blog";
import { calculatorContent } from "./content";
import { companyPages, privacySections, termsSections } from "./legal";
import { tools } from "./tools";

export const MIN_INDEXABLE_WORDS = 300;

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function commonLinkText(): string {
  return [
    "Free calculators",
    ...tools.map((tool) => tool.name),
    "Guides",
    ...blogArticles.map((article) => article.title),
    "About HelloKalku Contact Privacy policy Terms of use",
    "English Bahasa Malaysia Bahasa Indonesia",
    "Site operator amammustofa.com",
  ].join(" ");
}

export function routeVisibleWordCount(route: RouteSeoEntry, locale: Locale): number {
  const copy = route.copy[locale] ?? route.copy.en;
  const common = commonLinkText();

  if (route.slug === "home") {
    return words([
      copy.heading,
      copy.tagline,
      "HelloKalku provides free, private tools for practical decisions and learning in Malaysia.",
      ...tools.flatMap((tool) => [tool.name, tool.description]),
      ...blogArticles.flatMap((article) => [article.title, article.description]),
      common,
    ].join(" "));
  }
  if (route.slug === "blog") {
    return words([
      copy.heading,
      copy.tagline,
      ...blogArticles.flatMap((article) => [article.title, article.description]),
      common,
    ].join(" "));
  }
  if (route.slug === "privacy" || route.slug === "terms") {
    const sections = route.slug === "privacy" ? privacySections : termsSections;
    const intro = route.slug === "privacy"
      ? "HelloKalku is committed to protecting your privacy. We do not collect your calculator inputs, use anonymous analytics, and may show Google AdSense ads."
      : "Please read these Terms of Use carefully before using HelloKalku. By using this site you agree to these terms.";
    return words([route.slug, intro, ...sections.flatMap((section) => [section.heading, section.body]), common].join(" "));
  }
  if (route.slug === "about" || route.slug === "contact") {
    return words([
      companyPages[route.slug][locale].title,
      ...companyPages[route.slug][locale].paragraphs,
      "amammustofa.com",
      common,
    ].join(" "));
  }

  const content = calculatorContent[route.slug]?.[locale];
  if (!content) return words([copy.heading, copy.tagline, common].join(" "));
  return words([
    copy.heading,
    copy.tagline,
    content.intro,
    content.howItWorks.heading,
    ...content.howItWorks.paragraphs,
    content.formula?.heading,
    ...(content.formula?.paragraphs ?? []),
    content.rateTable?.heading,
    content.rateTable?.caption,
    ...(content.rateTable?.columns ?? []),
    ...(content.rateTable?.rows.flat() ?? []),
    content.rateTable?.note,
    content.examples?.length ? "Worked examples Result" : "",
    ...(content.examples?.flatMap((example) => [example.title, ...example.given, example.result]) ?? []),
    content.faq.length ? "Frequently asked questions" : "",
    ...content.faq.flatMap((item) => [item.question, item.answer]),
    common,
  ].filter(Boolean).join(" "));
}

export function isRouteIndexable(route: RouteSeoEntry, locale: Locale): boolean {
  return routeVisibleWordCount(route, locale) >= MIN_INDEXABLE_WORDS;
}
