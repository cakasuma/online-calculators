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
const LOCALES: Locale[] = ["en", "id"];

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
  const ogLocale = locale === "id" ? "id_ID" : "en_US";

  const altLinks = LOCALES.map(
    (alt) =>
      `    <link rel="alternate" hreflang="${alt}" href="${canonicalUrl(alt, route.path)}" />`,
  ).join("\n");

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
    `    <meta name="twitter:card" content="summary" />`,
    `    <meta name="twitter:title" content="${escapeHtml(copy.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(copy.description)}" />`,
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
        name: locale === "id" ? "Beranda" : "Home",
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
  const examples =
    content.examples && content.examples.length > 0
      ? `
        <h2>${locale === "id" ? "Contoh perhitungan" : "Worked examples"}</h2>
        ${content.examples
          .map(
            (ex) => `
        <article>
          <h3>${escapeHtml(ex.title)}</h3>
          <ul>${ex.given.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}</ul>
          <p><strong>${locale === "id" ? "Hasil:" : "Result:"}</strong> ${escapeHtml(ex.result)}</p>
        </article>`,
          )
          .join("")}`
      : "";
  const faq = `
        <h2>${locale === "id" ? "Pertanyaan yang sering diajukan" : "Frequently asked questions"}</h2>
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
    `\n${metaBlock}\n${jsonLd}\n  </head>`,
  );

  // Inject prerendered content as a sibling of #root so crawlers see prose even
  // before JS hydrates. We mark it data-prerender-fallback so a small inline
  // script can hide it once the SPA mounts.
  if (body) {
    const fallback = `
    <div id="prerender-fallback" data-prerender-fallback="${route.slug}">${body}
    </div>
    <script>(function(){var r=document.getElementById('root');var f=document.getElementById('prerender-fallback');if(!r||!f)return;var hide=function(){if(r.childElementCount>0){f.setAttribute('hidden','');}};var mo=new MutationObserver(hide);mo.observe(r,{childList:true});hide();})();</script>`;
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
      const alts = LOCALES.map(
        (alt) =>
          `      <xhtml:link rel="alternate" hreflang="${alt}" href="${canonicalUrl(alt, route.path)}" />`,
      ).join("\n");
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
