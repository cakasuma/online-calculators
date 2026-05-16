// Post-pass refinement — applies a second wave of id→ms substitutions to fix
// "stuck Indonesianisms" in the auto-generated ms blocks (within seo.ts and
// content.ts). Only ms: blocks are touched; en and id are left alone.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Additional substitutions (more nuanced — applied only inside ms: blocks).
const REFINEMENTS: Array<[RegExp, string]> = [
  [/\bgratis\b/g, "percuma"],
  [/\bGratis\b/g, "Percuma"],
  [/\bakurat\b/g, "tepat"],
  [/\bAkurat\b/g, "Tepat"],
  [/\bramah\b/g, "mesra"],
  [/\bRamah\b/g, "Mesra"],
  [/\bestimasi\b/g, "anggaran"],
  [/\bEstimasi\b/g, "Anggaran"],
  [/\bkaidah\b/g, "kaedah"],
  [/\bKaidah\b/g, "Kaedah"],
  [/\bskenario\b/g, "senario"],
  [/\bSkenario\b/g, "Senario"],
  [/\blayanan\b/g, "perkhidmatan"],
  [/\bLayanan\b/g, "Perkhidmatan"],
  [/\bcheckList\b/gi, "senarai semak"],
  [/\bchecklist\b/g, "senarai semak"],
  [/\bChecklist\b/g, "Senarai semak"],
  [/\balur kerja\b/g, "aliran kerja"],
  [/\bAlur kerja\b/g, "Aliran kerja"],
  [/\bAlur Kerja\b/g, "Aliran Kerja"],
  [/\bberkualitas\b/g, "berkualiti"],
  [/\bkualitas\b/g, "kualiti"],
  [/\bKualitas\b/g, "Kualiti"],
  [/\botomatis\b/g, "automatik"],
  [/\bOtomatis\b/g, "Automatik"],
  [/\bunduh\b/g, "muat turun"],
  [/\bUnduh\b/g, "Muat turun"],
  [/\bunggah\b/g, "muat naik"],
  [/\bUnggah\b/g, "Muat naik"],
  [/\bbisa\b/g, "boleh"],
  [/\bBisa\b/g, "Boleh"],
  [/\btidak bisa\b/g, "tidak boleh"],
  [/\bharus\b/g, "perlu"],
  [/\bHarus\b/g, "Perlu"],
  [/\bdapat\b/g, "boleh"],
  [/\bsekarang\b/g, "kini"],
  [/\bsaja\b/g, "sahaja"],
  [/\bcuma\b/g, "hanya"],
  [/\bsesuai dengan\b/g, "mengikut"],
  [/\bsesuai\b/g, "sepadan"],
  [/\bsekitar\b/g, "sekitar"],
  [/\bkira-kira\b/g, "kira-kira"],
  [/\bberbentuk\b/g, "berbentuk"],
  [/\bsangat\b/g, "sangat"],
  [/\bsekedar\b/g, "sekadar"],
  [/\btarif\b/g, "kadar"],
  [/\bTarif\b/g, "Kadar"],
  [/\bDihitung\b/g, "Dikira"],
  [/\bHitung\b/g, "Kira"],
  [/\bhitung\b/g, "kira"],
  [/\bditampilkan\b/g, "dipaparkan"],
  [/\bMenampilkan\b/g, "Memaparkan"],
  [/\bmenampilkan\b/g, "memaparkan"],
  [/\btampil\b/g, "papar"],
  [/\bTampil\b/g, "Papar"],
  [/\bdialihkan\b/g, "dialihkan"],
  [/\bdisalin\b/g, "disalin"],
  [/\bsalin\b/g, "salin"],
  [/\bbaru\b/g, "baharu"],
  [/\bBaru\b/g, "Baharu"],
  [/\blangsung\b/g, "terus"],
  [/\bbersih\b/g, "bersih"],
  [/\bsetelah\b/g, "selepas"],
  [/\bSetelah\b/g, "Selepas"],
  [/\bsebelum\b/g, "sebelum"],
  [/\bSebelum\b/g, "Sebelum"],
  [/\bdari\b/g, "daripada"],
  [/\bDari\b/g, "Daripada"],
  [/\bbisa juga\b/g, "boleh juga"],
  [/\bAlat Edukasi\b/g, "Alat Pendidikan"],
  [/\bedukasi\b/g, "pendidikan"],
  [/\bEdukasi\b/g, "Pendidikan"],
  [/\bGuru\b/g, "Guru"],
  [/\bjenis\b/g, "jenis"],
  [/\bjuga\b/g, "juga"],
  [/\bbeserta\b/g, "bersama"],
  [/\bbertahun-tahun\b/g, "bertahun-tahun"],
  [/\bsuami\/isteri\b/g, "suami/isteri"],
  [/\bsuami\/istri\b/g, "suami/isteri"],
  [/\btingkat\b/g, "tahap"],
  [/\bTingkat\b/g, "Tahap"],
  [/\bcicilan\b/g, "ansuran"],
  [/\bCicilan\b/g, "Ansuran"],
  [/\bbungkam\b/g, "diam"],
  [/\baturan\b/g, "peraturan"],
  [/\bAturan\b/g, "Peraturan"],
  [/\bkonsultasikan\b/g, "rujuk"],
  [/\bKonsultasikan\b/g, "Rujuk"],
  [/\bsenantiasa\b/g, "sentiasa"],
  [/\bSenantiasa\b/g, "Sentiasa"],
  [/\bselalu\b/g, "sentiasa"],
  [/\bSelalu\b/g, "Sentiasa"],
  [/\bberbagai\b/g, "pelbagai"],
  [/\bBerbagai\b/g, "Pelbagai"],
  [/\bmengelompokkan\b/g, "mengelaskan"],
  [/\bdikelompokkan\b/g, "dikelaskan"],
  [/\bdiklasifikasikan\b/g, "diklasifikasikan"],
  [/\bsetiap\b/g, "setiap"],
  [/\bberupa\b/g, "berupa"],
  [/\bjawaban\b/g, "jawapan"],
  [/\bJawaban\b/g, "Jawapan"],
  [/\bpertanyaan\b/g, "soalan"],
  [/\bPertanyaan\b/g, "Soalan"],
  [/\bdiajukan\b/g, "diajukan"],
  [/\bsering ditanyakan\b/g, "sering ditanya"],
  [/\bsering diajukan\b/g, "sering ditanya"],
  [/\btidak\b/g, "tidak"],
  [/\bya\b/g, "ya"],
  [/\bsesungguhnya\b/g, "sebenarnya"],
  [/\bSesungguhnya\b/g, "Sebenarnya"],
  [/\bdimana\b/g, "di mana"],
  [/\bDimana\b/g, "Di mana"],
  [/\bdaripada\b/g, "daripada"],
  [/\btahun lunar\b/g, "tahun qamariah"],
  [/\bTahun Lunar\b/g, "Tahun Qamariah"],
  [/\bImlek\b/g, "Qamariah"],
  [/\bdigunakan\b/g, "digunakan"],
  [/\bgunakan\b/g, "gunakan"],
  [/\bsehingga\b/g, "sehingga"],
  [/\bmemerlukan\b/g, "memerlukan"],
  [/\bmembutuhkan\b/g, "memerlukan"],
  [/\bdibutuhkan\b/g, "diperlukan"],
  [/\bperintah\b/g, "perintah"],
  [/\bperaturan\b/g, "peraturan"],
  [/\bmenetapkan\b/g, "menetapkan"],
  [/\bditetapkan\b/g, "ditetapkan"],
  [/\bpercoba\b/g, "cuba"],
  [/\bmencoba\b/g, "cuba"],
  [/\bdicoba\b/g, "dicuba"],
  [/\btombol\b/g, "butang"],
  [/\bTombol\b/g, "Butang"],
  [/\bsetel\b/g, "tetapkan"],
  [/\bSetel\b/g, "Tetapkan"],
  [/\bsudah\b/g, "sudah"],
  [/\bbelum\b/g, "belum"],
  [/\btampilan\b/g, "paparan"],
  [/\bTampilan\b/g, "Paparan"],
  [/\binputkan\b/g, "masukkan"],
  [/\bInputkan\b/g, "Masukkan"],
  [/\bmasukan\b/g, "masukan"],
];

function matchBrace(text: string, openIdx: number): number {
  let depth = 0;
  let inString: '"' | "'" | "`" | null = null;
  let prev = "";
  for (let i = openIdx; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === inString && prev !== "\\") inString = null;
    } else {
      if (c === '"' || c === "'" || c === "`") inString = c;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }
    prev = c === "\\" && prev === "\\" ? "" : c;
  }
  return -1;
}

function refineMsBlocks(filepath: string): { changed: number } {
  let content = fs.readFileSync(filepath, "utf8");
  const original = content;
  let changed = 0;

  // Find every ms: { ... } block and apply refinements only inside it.
  // Top-level ms: {} (in seo.ts/content.ts) is what we want. Single-line
  // ms: "..." (in i18n.ts) is also valid — handle that separately.

  // Multi-line ms: { ... }
  const msBlockRegex = /\n[ \t]*ms:\s*\{/g;
  let match: RegExpExecArray | null;
  const ranges: Array<[number, number]> = [];
  while ((match = msBlockRegex.exec(content)) !== null) {
    const openIdx = match.index + match[0].lastIndexOf("{");
    const closeIdx = matchBrace(content, openIdx);
    if (closeIdx > openIdx) ranges.push([openIdx, closeIdx]);
  }

  // Apply refinements in each range (work from end to start so offsets stay valid)
  ranges.sort((a, b) => b[0] - a[0]);
  for (const [start, end] of ranges) {
    let chunk = content.slice(start, end + 1);
    let chunkChanged = 0;
    for (const [pattern, replacement] of REFINEMENTS) {
      const before = chunk;
      chunk = chunk.replace(pattern, replacement);
      if (chunk !== before) chunkChanged++;
    }
    if (chunkChanged > 0) {
      content = content.slice(0, start) + chunk + content.slice(end + 1);
      changed += chunkChanged;
    }
  }

  // Also handle single-line ms: "..." entries (i18n.ts)
  // Pattern: ms: "..." inside the translations object literal.
  const singleLine = /(ms:\s*)"((?:[^"\\]|\\.)*)"/g;
  content = content.replace(singleLine, (m, prefix, value) => {
    let val = value.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    let valChanged = 0;
    for (const [pattern, replacement] of REFINEMENTS) {
      const before = val;
      val = val.replace(pattern, replacement);
      if (val !== before) valChanged++;
    }
    if (valChanged > 0) {
      changed += valChanged;
      const escaped = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${prefix}"${escaped}"`;
    }
    return m;
  });

  if (content !== original) fs.writeFileSync(filepath, content, "utf8");
  return { changed };
}

const files = [
  path.join(ROOT, "client/src/lib/i18n.ts"),
  path.join(ROOT, "client/src/config/seo.ts"),
  path.join(ROOT, "client/src/config/content.ts"),
];

let total = 0;
for (const f of files) {
  const { changed } = refineMsBlocks(f);
  console.log(`[refine-ms] ${path.relative(ROOT, f)}: ${changed} refinements`);
  total += changed;
}
console.log(`[refine-ms] total: ${total}`);
