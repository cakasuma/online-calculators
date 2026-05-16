// Build-time prerender step.
//
// After `vite build` emits the SPA shell to dist/public/index.html, this
// script generates a per-locale, per-route static HTML file with baked-in
// metadata (title, description, canonical, OG, hreflang), JSON-LD schema,
// and a server-rendered content block. Search-engine crawlers see the
// page content even before client-side JavaScript executes; users get the
// SPA on hydration.
//
// Also emits sitemap.xml + robots.txt.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routes, SITE_ORIGIN, canonicalUrl, type RouteSeoEntry } from "../client/src/config/seo";
import { calculatorContent, type CalculatorContent } from "../client/src/config/content";
import type { Locale } from "../client/src/lib/i18n";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(REPO_ROOT, "dist/public");
const SHELL_PATH = path.join(OUT_DIR, "index.html");
const LOCALES: Locale[] = ["en", "ms", "id"];

const LOCALIZED_STRINGS: Record<Locale, {
  home: string;
  workedExamples: string;
  resultLabel: string;
  faqHeading: string;
  ogLocale: string;
}> = {
  en: {
    home: "Home",
    workedExamples: "Worked examples",
    resultLabel: "Result:",
    faqHeading: "Frequently asked questions",
    ogLocale: "en_US",
  },
  ms: {
    home: "Laman Utama",
    workedExamples: "Contoh pengiraan",
    resultLabel: "Hasil:",
    faqHeading: "Soalan lazim",
    ogLocale: "ms_MY",
  },
  id: {
    home: "Beranda",
    workedExamples: "Contoh perhitungan",
    resultLabel: "Hasil:",
    faqHeading: "Pertanyaan yang sering diajukan",
    ogLocale: "id_ID",
  },
};

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildMetaBlock(route: RouteSeoEntry, locale: Locale): string {
  const copy = route.copy[locale] ?? route.copy.en;
  const canonical = canonicalUrl(locale, route.path);
  const ogLocale = LOCALIZED_STRINGS[locale].ogLocale;

  const altLinks = LOCALES.map((alt) => {
    const hreflang = alt === "ms" ? "ms-MY" : alt === "id" ? "id-ID" : "en";
    return `    <link rel="alternate" hreflang="${hreflang}" href="${canonicalUrl(alt, route.path)}" />`;
  }).join("\n");

  return [
    `    <title>${escapeHtml(copy.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(copy.description)}" />`,
    copy.keywords ? `    <meta name="keywords" content="${escapeHtml(copy.keywords)}" />` : "",
    `    <link rel="canonical" href="${canonical}" />`,
    altLinks,
    `    <link rel="alternate" hreflang="x-default" href="${canonicalUrl("en", route.path)}" />`,
    `    <meta property="og:type" content="${route.slug === "home" ? "website" : "article"}" />`,
    `    <meta property="og:title" content="${escapeHtml(copy.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(copy.description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:site_name" content="HelloKalku" />`,
    `    <meta property="og:locale" content="${ogLocale}" />`,
    `    <meta property="og:image" content="${SITE_ORIGIN}/og/${locale}/${route.slug}.png" />`,
    `    <meta property="og:image:width" content="1200" />`,
    `    <meta property="og:image:height" content="630" />`,
    `    <meta name="twitter:card" content="summary_large_image" />`,
    `    <meta name="twitter:title" content="${escapeHtml(copy.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(copy.description)}" />`,
    `    <meta name="twitter:image" content="${SITE_ORIGIN}/og/${locale}/${route.slug}.png" />`,
    `    <meta name="robots" content="index,follow,max-image-preview:large" />`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildJsonLd(route: RouteSeoEntry, locale: Locale, content: CalculatorContent | undefined): string {
  const copy = route.copy[locale] ?? route.copy.en;
  const canonical = canonicalUrl(locale, route.path);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: LOCALIZED_STRINGS[locale].home,
        item: `${SITE_ORIGIN}/${locale}`,
      },
      ...(route.slug !== "home"
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: copy.heading ?? copy.title,
              item: canonical,
            },
          ]
        : []),
    ],
  };

  const blocks: object[] = [breadcrumb];

  if (route.slug === "home") {
    blocks.unshift({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "HelloKalku",
      url: SITE_ORIGIN,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_ORIGIN}/${locale}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  } else {
    blocks.unshift({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: copy.heading ?? copy.title,
      url: canonical,
      description: copy.description,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "MYR" },
      inLanguage: locale,
    });
  }

  if (content?.faq && content.faq.length > 0) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  if (content?.howItWorks) {
    blocks.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: content.howItWorks.heading,
      step: content.howItWorks.paragraphs.map((text, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text,
      })),
    });
  }

  return blocks
    .map(
      (b) =>
        `    <script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`,
    )
    .join("\n");
}

function renderContentBody(content: CalculatorContent | undefined, copy: { heading?: string; tagline?: string }, locale: Locale): string {
  if (!content) {
    if (!copy.heading) return "";
    return `\n      <section>\n        <h1>${escapeHtml(copy.heading)}</h1>${copy.tagline ? `\n        <p>${escapeHtml(copy.tagline)}</p>` : ""}\n      </section>`;
  }

  const intro = `<p>${escapeHtml(content.intro)}</p>`;
  const howItWorks = `
        <h2>${escapeHtml(content.howItWorks.heading)}</h2>
        ${content.howItWorks.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n        ")}`;
  const formula = content.formula
    ? `
        <h2>${escapeHtml(content.formula.heading)}</h2>
        ${content.formula.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n        ")}`
    : "";
  const rateTable = content.rateTable
    ? `
        <h2>${escapeHtml(content.rateTable.heading)}</h2>
        ${content.rateTable.caption ? `<p>${escapeHtml(content.rateTable.caption)}</p>` : ""}
        <table>
          <thead><tr>${content.rateTable.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>
          <tbody>${content.rateTable.rows
            .map(
              (row) =>
                `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
            )
            .join("")}</tbody>
        </table>
        ${content.rateTable.note ? `<p><small>${escapeHtml(content.rateTable.note)}</small></p>` : ""}`
    : "";
  const examples =
    content.examples && content.examples.length > 0
      ? `
        <h2>${LOCALIZED_STRINGS[locale].workedExamples}</h2>
        ${content.examples
          .map(
            (ex) => `
        <article>
          <h3>${escapeHtml(ex.title)}</h3>
          <ul>${ex.given.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
          <p><strong>${LOCALIZED_STRINGS[locale].resultLabel}</strong> ${escapeHtml(ex.result)}</p>
        </article>`,
          )
          .join("")}`
      : "";
  const faq = `
        <h2>${LOCALIZED_STRINGS[locale].faqHeading}</h2>
        <dl>${content.faq
          .map(
            (item) =>
              `<dt>${escapeHtml(item.question)}</dt><dd>${escapeHtml(item.answer)}</dd>`,
          )
          .join("")}</dl>`;

  return `
      <article>
        <h1>${escapeHtml(copy.heading ?? "")}</h1>
        ${copy.tagline ? `<p>${escapeHtml(copy.tagline)}</p>` : ""}
        ${intro}
        ${howItWorks}
        ${formula}
        ${rateTable}
        ${examples}
        ${faq}
      </article>`;
}

function applyShell(shell: string, route: RouteSeoEntry, locale: Locale): string {
  const copy = route.copy[locale] ?? route.copy.en;
  const content = calculatorContent[route.slug]?.[locale];
  const metaBlock = buildMetaBlock(route, locale);
  const jsonLd = buildJsonLd(route, locale, content);
  const body = renderContentBody(content, copy, locale);

  let html = shell;
  html = html.replace(/<html\s+lang="[^"]*"/, `<html lang="${locale}"`);
  // Strip the SPA shell's existing meta block between charset and the AdSense meta
  // (we keep charset, viewport, and any scripts). We do this by removing the
  // original <title>, generic description, OG/Twitter/JSON-LD blocks and replacing
  // them with route-specific ones inserted right before </head>.
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*\/?\s*>/g, "")
    .replace(/<meta name="keywords"[^>]*\/?\s*>/g, "")
    .replace(/<link rel="canonical"[^>]*\/?\s*>/g, "")
    .replace(/<meta property="og:[^>]*\/?\s*>/g, "")
    .replace(/<meta name="twitter:[^>]*\/?\s*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

  html = html.replace(
    "</head>",
    `\n${metaBlock}\n${jsonLd}
    <style id="prerender-fallback-style">
      /* No-FOUC: when JS is enabled, hide the prerendered SEO fallback so
         users never see unstyled raw HTML between initial paint and React
         hydration. The fallback stays in the DOM for non-JS crawlers (AI
         bots, older indexers) which don't apply CSS. The .js class is set
         synchronously below before the body paints. */
      .js #prerender-fallback { display: none !important; }
    </style>
    <script>document.documentElement.classList.add('js');</script>
  </head>`,
  );

  // Inject prerendered content as a sibling of #root so crawlers see prose
  // even before JS hydrates. JS-enabled clients hide it via the no-FOUC CSS
  // rule injected in <head> above — no MutationObserver needed.
  if (body) {
    const fallback = `
    <div id="prerender-fallback" data-prerender-fallback="${route.slug}">${body}
    </div>`;
    html = html.replace(
      '<div id="root"></div>',
      `<div id="root"></div>${fallback}`,
    );
  }

  return html;
}

function writeRoute(shell: string, route: RouteSeoEntry, locale: Locale) {
  if (!route.prerender) return;
  const html = applyShell(shell, route, locale);
  const dir =
    route.path === "/"
      ? path.join(OUT_DIR, locale)
      : path.join(OUT_DIR, locale, route.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
}

function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [];
  for (const route of routes) {
    if (!route.prerender) continue;
    const priority = route.sitemap?.priority ?? 0.5;
    const changefreq = route.sitemap?.changefreq ?? "monthly";

    for (const locale of LOCALES) {
      const url = canonicalUrl(locale, route.path);
      const alts = LOCALES.map((alt) => {
        const hreflang = alt === "ms" ? "ms-MY" : alt === "id" ? "id-ID" : "en";
        return `      <xhtml:link rel="alternate" hreflang="${hreflang}" href="${canonicalUrl(alt, route.path)}" />`;
      }).join("\n");
      urls.push(
        `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`,
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>
`;
  fs.writeFileSync(path.join(OUT_DIR, "sitemap.xml"), xml, "utf8");
}

function writeRobots() {
  const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;
  fs.writeFileSync(path.join(OUT_DIR, "robots.txt"), robots, "utf8");
}

function main() {
  if (!fs.existsSync(SHELL_PATH)) {
    console.error(`[prerender] missing shell: ${SHELL_PATH}`);
    process.exit(1);
  }
  const shell = fs.readFileSync(SHELL_PATH, "utf8");

  let count = 0;
  for (const route of routes) {
    if (!route.prerender) continue;
    for (const locale of LOCALES) {
      writeRoute(shell, route, locale);
      count++;
    }
  }

  writeSitemap();
  writeRobots();

  console.log(`[prerender] wrote ${count} HTML files + sitemap.xml + robots.txt`);
}

main();
