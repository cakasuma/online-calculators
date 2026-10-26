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
import { blogArticles, type BlogArticle as BlogEntry } from "../client/src/config/blog";
import { CONTACT_EMAIL, ISSUES_URL, OPERATOR_URL, companyPages, privacySections, termsSections } from "../client/src/config/legal";
import { tools } from "../client/src/config/tools";
import { RATES_VERIFIED_DATE, RATE_SOURCES } from "../client/src/lib/sources";
import { isRouteIndexable, routeVisibleWordCount } from "../client/src/config/seoIndexability";
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

function buildMetaBlock(route: RouteSeoEntry, locale: Locale, indexableLocales: Locale[]): string {
  const copy = route.copy[locale] ?? route.copy.en;
  const canonical = canonicalUrl(locale, route.path);
  const ogLocale = LOCALIZED_STRINGS[locale].ogLocale;

  const altLinks = indexableLocales.map((alt) => {
    const hreflang = alt === "ms" ? "ms-MY" : alt === "id" ? "id-ID" : "en";
    return `    <link rel="alternate" hreflang="${hreflang}" href="${canonicalUrl(alt, route.path)}" />`;
  }).join("\n");

  return [
    `    <title>${escapeHtml(copy.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(copy.description)}" />`,
    copy.keywords ? `    <meta name="keywords" content="${escapeHtml(copy.keywords)}" />` : "",
    `    <link rel="canonical" href="${canonical}" />`,
    altLinks,
    indexableLocales.includes("en") ? `    <link rel="alternate" hreflang="x-default" href="${canonicalUrl("en", route.path)}" />` : "",
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
    `    <meta name="robots" content="${indexableLocales.includes(locale) ? "index,follow,max-image-preview:large" : "noindex,follow"}" />`,
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

const TOOL_LINK_GROUPS: { heading: string; hrefs: string[] }[] = [
  { heading: "Take-home pay, tax and EPF", hrefs: ["/salary", "/income-tax", "/epf-retirement"] },
  { heading: "Loans and savings", hrefs: ["/housing-loan", "/car-loan", "/fixed-deposit"] },
  { heading: "Islamic finance", hrefs: ["/zakat", "/faraid", "/wasiat"] },
  { heading: "More tools", hrefs: ["/normal", "/scientific", "/bmi", "/currency-converter"] },
];

function renderToolGroups(locale: Locale): string {
  return TOOL_LINK_GROUPS.map((group) => {
    const links = group.hrefs
      .map((href) => tools.find((tool) => tool.href === href))
      .filter((tool): tool is (typeof tools)[number] => Boolean(tool))
      .map((tool) => `
        <li><a href="/${locale}${tool.href}">${escapeHtml(tool.name)}</a></li>`)
      .join("");
    return `<h2>${group.heading}</h2><ul>${links}</ul>`;
  }).join("\n        ");
}

function renderSharedLinks(locale: Locale): string {
  const blogLinks = blogArticles.map((article) => `
        <li><a href="/en/blog/${article.slug}">${escapeHtml(article.title)}</a></li>`).join("");
  const localeLinks = LOCALES.map((alt) => {
    const label = alt === "ms" ? "Bahasa Malaysia" : alt === "id" ? "Bahasa Indonesia" : "English";
    return `<a href="/${alt}/">${label}</a>`;
  }).join(" · ");

  return `
      <nav aria-label="Calculators and site information">
        ${renderToolGroups(locale)}
        <h2>Guides</h2><ul>${blogLinks}</ul>
        <h2>About HelloKalku</h2>
        <p><a href="/${locale}/about">About</a> · <a href="/${locale}/contact">Contact</a> · <a href="/${locale}/privacy">Privacy policy</a> · <a href="/${locale}/terms">Terms of use</a></p>
        <p>Languages: ${localeLinks}</p>
        <p>Site operator: <a href="${OPERATOR_URL}">amammustofa.com</a>${CONTACT_EMAIL ? ` · <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>` : ""}</p>
      </nav>`;
}

function renderLegalSections(sections: typeof privacySections, locale: Locale): string {
  const intro = sections === privacySections
    ? "HelloKalku is committed to protecting your privacy. We do not collect your calculator inputs, use anonymous analytics, and may show Google AdSense ads."
    : "Please read these Terms of Use carefully before using HelloKalku. By using this site you agree to these terms.";
  return `
      <article>
        <h1>${escapeHtml(sections === privacySections ? "Privacy policy" : "Terms of use")}</h1>
        <p>${escapeHtml(intro)}</p>
        ${sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}${section.heading === "10. Contact" ? ` <a href="${OPERATOR_URL}">amammustofa.com</a>${CONTACT_EMAIL ? ` · <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>` : ""}` : ""}</p></section>`).join("\n")}
      </article>`;
}

function renderBlogArticle(article: BlogEntry): string {
  const sections = article.sections.map((section) => `
        <section>
          ${section.heading ? `<h2>${escapeHtml(section.heading)}</h2>` : ""}
          ${section.body?.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("") ?? ""}
          ${section.list ? `<ul>${section.list.map((item) => `<li>${escapeHtml(item.text)}${item.subtext ? ` — ${escapeHtml(item.subtext)}` : ""}</li>`).join("")}</ul>` : ""}
          ${section.table ? `<table><thead><tr>${section.table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead><tbody>${section.table.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>` : ""}
          ${section.callout ? `<p><strong>${escapeHtml(section.callout)}</strong></p>` : ""}
          ${section.source ? `<p>Source: <a href="${escapeHtml(section.source.href)}">${escapeHtml(section.source.label)}</a></p>` : ""}
        </section>`).join("");
  const related = article.relatedCalculator
    ? `<p><a href="/en${article.relatedCalculator.href}">${escapeHtml(article.relatedCalculator.label)}</a></p>`
    : "";
  return `
      <article>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.description)}</p>
        <p>${escapeHtml(article.intro)}</p>
        <p>Published ${escapeHtml(article.publishedDate)} · ${article.readingTime} min read · ${escapeHtml(article.categoryLabel)}</p>
        ${sections}
        ${related}
      </article>`;
}

function renderContentBody(route: RouteSeoEntry, content: CalculatorContent | undefined, copy: { heading?: string; tagline?: string }, locale: Locale): string {
  if (route.slug === "home") {
    return `
      <article>
        <h1>${escapeHtml(copy.heading ?? "")}</h1>
        <p>${escapeHtml(copy.tagline ?? "")} HelloKalku provides free, private tools for practical decisions and learning in Malaysia.</p>
        <h2>From payslip to plan, in three steps</h2>
        <ol>
          <li><a href="/${locale}/salary">Salary calculator</a> — monthly pay after EPF, SOCSO, EIS, the new SKBBK deduction and PCB, with a foreign-worker mode and employer cost view.</li>
          <li><a href="/${locale}/income-tax">Income tax calculator</a> — add reliefs to see your YA 2026 tax and monthly PCB.</li>
          <li><a href="/${locale}/epf-retirement">EPF retirement calculator</a> — project your balance against the Basic Savings target.</li>
        </ol>
        <p>Rates were last verified on ${RATES_VERIFIED_DATE} against <a href="${RATE_SOURCES.kwsp.url}">KWSP</a>, <a href="${RATE_SOURCES.perkeso.url}">PERKESO</a> and <a href="${RATE_SOURCES.lhdn.url}">LHDN</a>. Built by Mustofa Amami — see our <a href="/${locale}/about">methodology</a>.</p>
        <h2>Loans, savings and Islamic finance</h2>
        <ul>${["/housing-loan", "/car-loan", "/fixed-deposit", "/zakat", "/faraid", "/wasiat"].map((href) => tools.find((tool) => tool.href === href)).filter((tool): tool is (typeof tools)[number] => Boolean(tool)).map((tool) => `<li><a href="/${locale}${tool.href}">${escapeHtml(tool.name)}</a> — ${escapeHtml(tool.description)}</li>`).join("")}</ul>
        <h2>Learn how the numbers work</h2>
        <ul>${blogArticles.map((article) => `<li><a href="/en/blog/${article.slug}">${escapeHtml(article.title)}</a> — ${escapeHtml(article.description)}</li>`).join("")}</ul>
      </article>`;
  }
  if (route.slug === "blog") {
    return `
      <article>
        <h1>${escapeHtml(copy.heading ?? "")}</h1>
        <p>${escapeHtml(copy.tagline ?? "")}</p>
        <ul>${blogArticles.map((article) => `<li><a href="/en/blog/${article.slug}">${escapeHtml(article.title)}</a> — ${escapeHtml(article.description)}</li>`).join("")}</ul>
      </article>`;
  }
  if (route.slug === "privacy") return renderLegalSections(privacySections, locale);
  if (route.slug === "terms") return renderLegalSections(termsSections, locale);
  if (route.slug === "about" || route.slug === "contact") {
    const page = companyPages[route.slug][locale];
    return `
      <article>
        <h1>${escapeHtml(page.title)}</h1>
        ${page.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        <p><a href="${OPERATOR_URL}">amammustofa.com</a> · <a href="${ISSUES_URL}">GitHub issues</a> · <a href="/${locale}/${route.slug === "about" ? "contact" : "about"}">${route.slug === "about" ? "Contact" : "About"}</a>${CONTACT_EMAIL ? ` · <a href="mailto:${escapeHtml(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>` : ""}</p>
      </article>`;
  }
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

function applyShell(shell: string, route: RouteSeoEntry, locale: Locale): { html: string; indexable: boolean; wordCount: number } {
  const copy = route.copy[locale] ?? route.copy.en;
  const content = calculatorContent[route.slug]?.[locale];
  const pageBody = `${renderContentBody(route, content, copy, locale)}${renderSharedLinks(locale)}`;
  const wordCount = routeVisibleWordCount(route, locale);
  const indexable = isRouteIndexable(route, locale);
  const indexableLocales = LOCALES.filter((alt) => isRouteIndexable(route, alt));
  const metaBlock = buildMetaBlock(route, locale, indexableLocales);
  const jsonLd = buildJsonLd(route, locale, content);
  const body = pageBody;

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
    .replace(/<meta name="robots"[^>]*\/?\s*>/g, "")
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

  return { html, indexable, wordCount };
}

function writeRoute(shell: string, route: RouteSeoEntry, locale: Locale) {
  if (!route.prerender) return;
  const { html, indexable, wordCount } = applyShell(shell, route, locale);
  const dir =
    route.path === "/"
      ? path.join(OUT_DIR, locale)
      : path.join(OUT_DIR, locale, route.path.replace(/^\//, ""));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
  if (!indexable) console.log(`[prerender] noindex ${locale}${route.path} (${wordCount} words)`);
}

function applyBlogArticleShell(shell: string, article: BlogEntry): string {
  const canonical = `${SITE_ORIGIN}/en/blog/${article.slug}`;
  const title = `${article.title} | HelloKalku`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedDate,
    dateModified: article.publishedDate,
    author: { "@type": "Person", name: "amammustofa", url: OPERATOR_URL },
    publisher: { "@type": "Organization", name: "HelloKalku", url: SITE_ORIGIN },
    mainEntityOfPage: canonical,
    inLanguage: "en",
    image: `${SITE_ORIGIN}/og-default.png`,
  };
  let html = shell.replace(/<html\s+lang="[^"]*"/, '<html lang="en"');
  html = html
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta name="description"[^>]*\/?\s*>/g, "")
    .replace(/<meta name="keywords"[^>]*\/?\s*>/g, "")
    .replace(/<meta name="robots"[^>]*\/?\s*>/g, "")
    .replace(/<link rel="canonical"[^>]*\/?\s*>/g, "")
    .replace(/<link rel="alternate"[^>]*\/?\s*>/g, "")
    .replace(/<meta property="og:[^>]*\/?\s*>/g, "")
    .replace(/<meta name="twitter:[^>]*\/?\s*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  const metadata = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(article.description)}" />`,
    `<meta name="keywords" content="${escapeHtml(article.keywords)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" hreflang="en" href="${canonical}" />`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}" />`,
    `<meta name="robots" content="index,follow,max-image-preview:large" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(article.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:site_name" content="HelloKalku" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:image" content="${SITE_ORIGIN}/og-default.png" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(article.description)}" />`,
    `<meta name="twitter:image" content="${SITE_ORIGIN}/og-default.png" />`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
  html = html.replace("</head>", `${metadata}
    <style id="prerender-fallback-style">.js #prerender-fallback { display: none !important; }</style>
    <script>document.documentElement.classList.add('js');</script>
  </head>`);
  const body = `${renderBlogArticle(article)}${renderSharedLinks("en")}`;
  return html.replace('<div id="root"></div>', `<div id="root"></div><div id="prerender-fallback" data-prerender-fallback="blog-article">${body}</div>`);
}

function writeBlogArticles(shell: string) {
  for (const article of blogArticles) {
    const dir = path.join(OUT_DIR, "en", "blog", article.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), applyBlogArticleShell(shell, article), "utf8");
  }
}

function writeNotFound(shell: string) {
  let html = shell.replace(/<html\s+lang="[^"]*"/, '<html lang="en"');
  html = html.replace(/<title>[\s\S]*?<\/title>/, "<title>Page not found | HelloKalku</title>")
    .replace(/<meta name="description"[^>]*\/?\s*>/g, "")
    .replace(/<meta name="keywords"[^>]*\/?\s*>/g, "")
    .replace(/<meta name="robots"[^>]*\/?\s*>/g, "")
    .replace(/<link rel="canonical"[^>]*\/?\s*>/g, "")
    .replace(/<meta property="og:[^>]*\/?\s*>/g, "")
    .replace(/<meta name="twitter:[^>]*\/?\s*>/g, "")
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")
    .replace("</head>", `<meta name="robots" content="noindex,follow" />
    <meta name="description" content="The requested HelloKalku page could not be found." />
    <style id="prerender-fallback-style">.js #prerender-fallback { display: none !important; }</style>
    <script>document.documentElement.classList.add('js');</script>
  </head>`);
  const body = `<article><h1>Page not found</h1><p>The requested page could not be found. Use one of the links below to continue.</p></article>${renderSharedLinks("en")}`;
  fs.writeFileSync(path.join(OUT_DIR, "404.html"), html.replace('<div id="root"></div>', `<div id="root"></div><div id="prerender-fallback" data-prerender-fallback="not-found">${body}</div>`), "utf8");
}

function writeSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls: string[] = [];
  for (const route of routes) {
    if (!route.prerender) continue;
    const priority = route.sitemap?.priority ?? 0.5;
    const changefreq = route.sitemap?.changefreq ?? "monthly";

    for (const locale of LOCALES) {
      if (!isRouteIndexable(route, locale)) continue;
      const url = canonicalUrl(locale, route.path);
      const alts = LOCALES.filter((alt) => isRouteIndexable(route, alt)).map((alt) => {
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

  // Blog articles — English-only, no hreflang alternates needed
  for (const article of blogArticles) {
    urls.push(
      `  <url>
    <loc>${SITE_ORIGIN}/en/blog/${article.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`,
    );
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

  writeBlogArticles(shell);
  writeNotFound(shell);
  writeSitemap();
  writeRobots();

  console.log(`[prerender] wrote ${count} route pages + ${blogArticles.length} blog articles + 404.html, sitemap.xml + robots.txt`);
}

main();
