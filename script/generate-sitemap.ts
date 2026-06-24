// Refreshes the committed static sitemap at client/public/sitemap.xml from the
// single source of truth (seo.ts routes + blog articles).
//
// The production build's prerender step (script/prerender.ts) regenerates the
// authoritative sitemap into dist/public at build time. This script keeps the
// checked-in fallback — served in dev and before the prerender overwrites it —
// in sync with the routes, so it never drifts out of date again. Run it after
// adding or removing a route:
//
//   npx tsx script/generate-sitemap.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { routes, SITE_ORIGIN, canonicalUrl } from "../client/src/config/seo";
import { blogArticles } from "../client/src/config/blog";
import type { Locale } from "../client/src/lib/i18n";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH = path.resolve(__dirname, "../client/public/sitemap.xml");
const LOCALES: Locale[] = ["en", "ms", "id"];

function hreflang(locale: Locale): string {
  return locale === "ms" ? "ms-MY" : locale === "id" ? "id-ID" : "en";
}

const urls: string[] = [];

for (const route of routes) {
  if (!route.prerender) continue;
  const priority = route.sitemap?.priority ?? 0.5;
  const changefreq = route.sitemap?.changefreq ?? "monthly";
  for (const locale of LOCALES) {
    const alts = LOCALES.map(
      (alt) => `      <xhtml:link rel="alternate" hreflang="${hreflang(alt)}" href="${canonicalUrl(alt, route.path)}"/>`,
    ).join("\n");
    urls.push(
      `  <url>
    <loc>${canonicalUrl(locale, route.path)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`,
    );
  }
}

// Blog articles — English-only, no hreflang alternates.
for (const article of blogArticles) {
  urls.push(
    `  <url>
    <loc>${SITE_ORIGIN}/en/blog/${article.slug}</loc>
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

fs.writeFileSync(OUT_PATH, xml, "utf8");
console.log(`[generate-sitemap] wrote ${urls.length} URLs to ${path.relative(process.cwd(), OUT_PATH)}`);
