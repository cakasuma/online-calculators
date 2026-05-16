// Migration script (pass 2) — adds `ms: { ... }` blocks alongside every
// `id: { ... }` block in seo.ts and content.ts. The ms block is derived from
// the id block by running every string literal through the id→ms substitution
// dictionary defined in script/add-ms-locale.ts (re-exported for reuse).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Inlined to avoid cross-module import complications.
const SUBSTITUTIONS: Array<[RegExp, string]> = [
  [/\bAtur Ulang\b/g, "Tetapkan Semula"],
  [/\bMata Uang\b/g, "Mata Wang"],
  [/\bsaat ini\b/g, "kini"],
  [/\bsehari-hari\b/g, "harian"],
  [/\bbelum ada\b/g, "tiada"],
  [/\bBelum ada\b/g, "Tiada"],
  [/\bmempersiapkan\b/g, "menyediakan"],
  [/\bperhitungan\b/g, "pengiraan"],
  [/\bPerhitungan\b/g, "Pengiraan"],
  [/\bperencanaan\b/g, "perancangan"],
  [/\bPerencanaan\b/g, "Perancangan"],
  [/\bperangkat\b/g, "peranti"],
  [/\bdiperbarui\b/g, "dikemas kini"],
  [/\bpengaturan\b/g, "tetapan"],
  [/\bPengaturan\b/g, "Tetapan"],
  [/\bpenghasilan\b/g, "pendapatan"],
  [/\bPenghasilan\b/g, "Pendapatan"],
  [/\bpajak\b/g, "cukai"],
  [/\bPajak\b/g, "Cukai"],
  [/\bperpajakan\b/g, "percukaian"],
  [/\binvestasi\b/g, "pelaburan"],
  [/\bInvestasi\b/g, "Pelaburan"],
  [/\baktivitas\b/g, "aktiviti"],
  [/\bAktivitas\b/g, "Aktiviti"],
  [/\bKesalahan\b/g, "Ralat"],
  [/\bkesalahan\b/g, "ralat"],
  [/\bHapus\b/g, "Padam"],
  [/\bhapus\b/g, "padam"],
  [/\bSelanjutnya\b/g, "Seterusnya"],
  [/\bselanjutnya\b/g, "seterusnya"],
  [/\bberikutnya\b/g, "seterusnya"],
  [/\bBerikutnya\b/g, "Seterusnya"],
  [/\bRiwayat\b/g, "Sejarah"],
  [/\briwayat\b/g, "sejarah"],
  [/\bBeranda\b/g, "Laman Utama"],
  [/\bDasar\b/g, "Asas"],
  [/\bdasar\b/g, "asas"],
  [/\bIlmiah\b/g, "Saintifik"],
  [/\bilmiah\b/g, "saintifik"],
  [/\bMatematika\b/g, "Matematik"],
  [/\bmatematika\b/g, "matematik"],
  [/\bAlat Lainnya\b/g, "Alat Lain"],
  [/\bLainnya\b/g, "Lain"],
  [/\blainnya\b/g, "lain"],
  [/\baritmatika\b/g, "aritmetik"],
  [/\bAritmatika\b/g, "Aritmetik"],
  [/\bdiagram\b/g, "carta"],
  [/\bDiagram\b/g, "Carta"],
  [/\bgrafik\b/g, "graf"],
  [/\bGrafik\b/g, "Graf"],
  [/\bpenduduk\b/g, "pemastautin"],
  [/\bPenduduk\b/g, "Pemastautin"],
  [/\bnon-penduduk\b/g, "bukan pemastautin"],
  [/\bketentuan\b/g, "syarat"],
  [/\bKetentuan\b/g, "Syarat"],
  [/\bpenafian\b/g, "penafian"],
  [/\btanggung jawab\b/g, "tanggungjawab"],
  [/\bKebijakan\b/g, "Dasar"],
  [/\bkebijakan\b/g, "dasar"],
  [/\bcakupan\b/g, "skop"],
  [/\bMisalnya\b/g, "Sebagai contoh"],
  [/\bmisalnya\b/g, "sebagai contoh"],
  [/\bdetail\b/g, "terperinci"],
  [/\bDetail\b/g, "Terperinci"],
  [/\brincian\b/g, "perincian"],
  [/\bRincian\b/g, "Perincian"],
  [/\bAyah\b/g, "Bapa"],
  [/\bIstri\b/g, "Isteri"],
  [/\bistri\b/g, "isteri"],
  [/\bAnak Laki-laki\b/g, "Anak Lelaki"],
  [/\bSaudara Laki-laki\b/g, "Saudara Lelaki"],
  [/\blaki-laki\b/g, "lelaki"],
  [/\bLaki-laki\b/g, "Lelaki"],
  [/\bSeayah\b/g, "Sebapa"],
  [/\bseayah\b/g, "sebapa"],
  [/\borang tua\b/g, "ibu bapa"],
  [/\bOrang Tua\b/g, "Ibu Bapa"],
  [/\bUtang\b/g, "Hutang"],
  [/\butang\b/g, "hutang"],
  [/\bBiaya\b/g, "Kos"],
  [/\bbiaya\b/g, "kos"],
  [/\bpemakaman\b/g, "pengebumian"],
  [/\bPemakaman\b/g, "Pengebumian"],
  [/\bnomor\b/g, "nombor"],
  [/\bNomor\b/g, "Nombor"],
  [/\bcatatan\b/g, "nota"],
  [/\bCatatan\b/g, "Nota"],
  [/\bdihitung\b/g, "dikira"],
  [/\bmenghitung\b/g, "mengira"],
  [/\bMenghitung\b/g, "Mengira"],
  [/\bPembagian\b/g, "Pembahagian"],
  [/\bpembagian\b/g, "pembahagian"],
  [/\bdibagikan\b/g, "dibahagikan"],
  [/\bdibagi\b/g, "dibahagikan"],
  [/\bbagian\b/g, "bahagian"],
  [/\bBagian\b/g, "Bahagian"],
  [/\bukuran\b/g, "saiz"],
  [/\bUkuran\b/g, "Saiz"],
  [/\btabungan\b/g, "simpanan"],
  [/\bTabungan\b/g, "Simpanan"],
  [/\busaha\b/g, "perniagaan"],
  [/\bUsaha\b/g, "Perniagaan"],
  [/\bbisnis\b/g, "perniagaan"],
  [/\bBisnis\b/g, "Perniagaan"],
  [/\bdukungan\b/g, "sokongan"],
  [/\bDukungan\b/g, "Sokongan"],
  [/\bmendukung\b/g, "menyokong"],
  [/\bMendukung\b/g, "Menyokong"],
  [/\btidak ada\b/g, "tiada"],
  [/\bTidak ada\b/g, "Tiada"],
  [/\bmobile\b/g, "mudah alih"],
  [/\bringkas\b/g, "ringkas"],
  [/\bpraktis\b/g, "praktikal"],
  [/\bPraktis\b/g, "Praktikal"],
  [/\bcepat\b/g, "pantas"],
  [/\bCepat\b/g, "Pantas"],
  [/\bmencakup\b/g, "merangkumi"],
  [/\bmeliputi\b/g, "merangkumi"],
  [/\bpresentasi\b/g, "pembentangan"],
  [/\bpekerja\b/g, "pekerja"],
  [/\bpotongan\b/g, "potongan"],
  [/\bPotongan\b/g, "Potongan"],
  [/\bharta\b/g, "harta"],
  [/\bHarta\b/g, "Harta"],
  [/\bAhli waris\b/g, "Waris"],
  [/\bahli waris\b/g, "waris"],
  [/\bKakek\b/g, "Datuk"],
  [/\bkakek\b/g, "datuk"],
  [/\bNenek\b/g, "Nenek"],
];

function transformIdString(s: string): string {
  let out = s;
  for (const [pattern, replacement] of SUBSTITUTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// Find the matching closing brace for an opening `{` at the given index.
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

// Transform every "..."-delimited string inside the given chunk.
// Avoids breaking on escaped quotes.
function transformStringsInChunk(chunk: string): string {
  let out = "";
  let i = 0;
  while (i < chunk.length) {
    const c = chunk[i];
    if (c === '"') {
      // start of string literal — find end
      let j = i + 1;
      while (j < chunk.length) {
        if (chunk[j] === "\\") {
          j += 2;
          continue;
        }
        if (chunk[j] === '"') break;
        j++;
      }
      const raw = chunk.slice(i + 1, j);
      // unescape
      const unescaped = raw.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
      const transformed = transformIdString(unescaped);
      const escaped = transformed
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");
      out += '"' + escaped + '"';
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

// Find every `\n<indent>id: {` block, brace-match, and insert an `<indent>ms: { ... },\n`
// block before the en/id pair's `en: {`. We insert ms RIGHT BEFORE the existing id
// block to make the order en, ms, id consistent with our type's locale ordering.
function processFile(filepath: string): { changed: number } {
  let content = fs.readFileSync(filepath, "utf8");
  let changed = 0;

  // Repeatedly find the next `id: {` that does not have a preceding `ms: {`
  // in the same parent object.
  // Easier algorithm: walk through and for each `id: {` block, look upward up to ~3000
  // chars for a sibling `ms: {`. If not found, generate.
  const idBlockRegex = /(\n[ \t]*)id:\s*\{/g;
  const insertions: Array<{ at: number; text: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = idBlockRegex.exec(content)) !== null) {
    const blockStart = match.index + match[0].lastIndexOf("{");
    const blockEnd = matchBrace(content, blockStart);
    if (blockEnd < 0) continue;

    // Look upward within the enclosing parent (i.e. until we hit the matching `en: {`
    // for this same group). Find the `en: {` immediately preceding this `id: {`
    // at the same indent level.
    const indent = match[1];
    const upToHere = content.slice(0, match.index);
    const enRegex = new RegExp(`(${indent.replace(/[\t]/g, "\\t")})en:\\s*\\{`, "g");
    let enMatch: RegExpExecArray | null;
    let lastEn: RegExpExecArray | null = null;
    while ((enMatch = enRegex.exec(upToHere)) !== null) lastEn = enMatch;
    if (!lastEn) continue;

    // Look between the en block end and this id block for an existing ms: { entry
    const enBlockStart = lastEn.index + lastEn[0].lastIndexOf("{");
    const enBlockEnd = matchBrace(content, enBlockStart);
    if (enBlockEnd < 0) continue;
    const between = content.slice(enBlockEnd, match.index);
    if (/\n\s*ms:\s*\{/.test(between)) continue;

    // Generate ms block by transforming the id block content
    const idBlockText = content.slice(blockStart, blockEnd + 1);
    const msBlockText = transformStringsInChunk(idBlockText);
    const insertion = `${indent}ms: ${msBlockText},`;

    // Insert right BEFORE the `id:` keyword (after the leading newline)
    const insertAt = match.index + match[1].length;
    insertions.push({
      at: insertAt,
      text: insertion + match[1],
    });
    changed++;
  }

  // Apply insertions from end to start so offsets stay valid
  insertions.sort((a, b) => b.at - a.at);
  for (const ins of insertions) {
    content = content.slice(0, ins.at) + ins.text + content.slice(ins.at);
  }

  if (changed > 0) fs.writeFileSync(filepath, content, "utf8");
  return { changed };
}

const files = [
  path.join(ROOT, "client/src/config/seo.ts"),
  path.join(ROOT, "client/src/config/content.ts"),
];

let totalChanged = 0;
for (const f of files) {
  const { changed } = processFile(f);
  console.log(`[add-ms-nested] ${path.relative(ROOT, f)}: +${changed} ms blocks`);
  totalChanged += changed;
}
console.log(`[add-ms-nested] total: ${totalChanged}`);
