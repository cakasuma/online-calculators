// Refreshes the bundled FX_SNAPSHOT in client/src/lib/currency.ts from the
// live Frankfurter (ECB reference rates) API. The snapshot feeds prerendered
// currency-converter pages and is the offline fallback, so refresh it before
// a deploy to keep the static copy current:
//
//   npx tsx script/update-fx-rates.ts && npx tsx script/generate-sitemap.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CURRENCY_CODES, FX_API_URL, parseRatesPayload } from "../client/src/lib/currency";

const FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../client/src/lib/currency.ts");

const res = await fetch(FX_API_URL);
if (!res.ok) throw new Error(`Rate request failed: ${res.status}`);
const snap = parseRatesPayload(await res.json());
if (!snap) throw new Error("Rate payload was missing a supported currency or malformed");

const lines = CURRENCY_CODES.map((c) => `    ${c}: ${snap.rates[c]},`).join("\n");
const block = `/** Reference rates from the ECB via Frankfurter, ${snap.date}. */
export const FX_SNAPSHOT: RateSnapshot = {
  date: "${snap.date}",
  rates: {
${lines}
  },
};`;

const src = fs.readFileSync(FILE, "utf8");
const re = /\/\*\* Reference rates from the ECB via Frankfurter[^\n]*\*\/\nexport const FX_SNAPSHOT: RateSnapshot = \{[\s\S]*?\n\};/;
if (!re.test(src)) throw new Error("FX_SNAPSHOT block not found in currency.ts");
fs.writeFileSync(FILE, src.replace(re, block), "utf8");
console.log(`[update-fx-rates] snapshot set to ${snap.date}`);
