// Migration script — adds `ms:` keys alongside every `id:` key in
// i18n.ts, seo.ts, and content.ts. The ms value is derived from the id value
// via a Bahasa Indonesia → Bahasa Malaysia substitution dictionary (token-aware,
// case-preserving). Subsequent hand-tuning is applied for the highest-traffic
// strings (page titles, taglines, intros) which deserve native-quality copy.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// id → ms token substitutions. Whole-word only (we wrap each entry in \b…\b).
// Ordered most specific → least specific to avoid double-mapping.
const SUBSTITUTIONS: Array<[RegExp, string]> = [
  // Multi-word phrases first
  [/\bAtur Ulang\b/g, "Tetapkan Semula"],
  [/\bMata Uang\b/g, "Mata Wang"],
  [/\bKakek\b/g, "Datuk"],
  [/\bnenek\b/g, "nenek"],
  [/\bMata Uang\b/g, "Mata Wang"],
  [/\bsaat ini\b/g, "kini"],
  [/\bsehari-hari\b/g, "harian"],
  [/\bbelum ada\b/g, "tiada"],
  [/\bBelum ada\b/g, "Tiada"],
  [/\bAkan datang\b/g, "Akan datang"],
  [/\bmempersiapkan\b/g, "menyediakan"],
  [/\bperhitungan\b/g, "pengiraan"],
  [/\bPerhitungan\b/g, "Pengiraan"],
  [/\bperencanaan\b/g, "perancangan"],
  [/\bPerencanaan\b/g, "Perancangan"],
  [/\bperangkat\b/g, "peranti"],
  [/\bdiperbarui\b/g, "dikemas kini"],
  [/\bdibarui\b/g, "dikemas kini"],
  [/\bpengaturan\b/g, "tetapan"],
  [/\bPengaturan\b/g, "Tetapan"],
  [/\bpenghasilan\b/g, "pendapatan"],
  [/\bPenghasilan\b/g, "Pendapatan"],
  [/\bpajak\b/g, "cukai"],
  [/\bPajak\b/g, "Cukai"],
  [/\bperpajakan\b/g, "percukaian"],
  [/\bberalih\b/g, "beralih"],
  [/\bbahasa\b/g, "bahasa"],
  [/\binvestasi\b/g, "pelaburan"],
  [/\bInvestasi\b/g, "Pelaburan"],
  [/\baktivitas\b/g, "aktiviti"],
  [/\bAktivitas\b/g, "Aktiviti"],
  [/\bAnda\b/g, "Anda"],
  [/\banda\b/g, "anda"],
  [/\bKesalahan\b/g, "Ralat"],
  [/\bkesalahan\b/g, "ralat"],
  [/\bHapus\b/g, "Padam"],
  [/\bhapus\b/g, "padam"],
  [/\bSelanjutnya\b/g, "Seterusnya"],
  [/\bselanjutnya\b/g, "seterusnya"],
  [/\bberikutnya\b/g, "seterusnya"],
  [/\bBerikutnya\b/g, "Seterusnya"],
  [/\bsebelumnya\b/g, "sebelumnya"],
  [/\bSebelumnya\b/g, "Sebelumnya"],
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
  [/\bDokumen\b/g, "Dokumen"],
  [/\bdokumen\b/g, "dokumen"],
  [/\baritmatika\b/g, "aritmetik"],
  [/\bAritmatika\b/g, "Aritmetik"],
  [/\bdwibahasa\b/g, "dwibahasa"],
  [/\bdiagram\b/g, "carta"],
  [/\bDiagram\b/g, "Carta"],
  [/\bgrafik\b/g, "graf"],
  [/\bGrafik\b/g, "Graf"],
  [/\bsuratan\b/g, "dokumen"],
  [/\bahli waris\b/g, "ahli waris"],
  [/\bdivisualisasi\b/g, "divisualisasi"],
  [/\bvisualisasi\b/g, "visualisasi"],
  [/\bpenduduk\b/g, "pemastautin"],
  [/\bPenduduk\b/g, "Pemastautin"],
  [/\bnon-penduduk\b/g, "bukan pemastautin"],
  [/\bgaji bersih\b/g, "gaji bersih"],
  [/\bPotongan\b/g, "Potongan"],
  [/\bpotongan\b/g, "potongan"],
  [/\bpekerja\b/g, "pekerja"],
  [/\bPekerja\b/g, "Pekerja"],
  [/\bpekerja asing\b/g, "pekerja asing"],
  [/\bperaturan\b/g, "peraturan"],
  [/\bketentuan\b/g, "syarat"],
  [/\bKetentuan\b/g, "Syarat"],
  [/\bsyariah\b/g, "syariah"],
  [/\bSyariah\b/g, "Syariah"],
  [/\bpenafian\b/g, "penafian"],
  [/\btanggung jawab\b/g, "tanggungjawab"],
  [/\bKebijakan\b/g, "Dasar"],
  [/\bkebijakan\b/g, "dasar"],
  [/\bcakupan\b/g, "skop"],
  [/\bcth\./g, "cth."],
  [/\bMisalnya\b/g, "Sebagai contoh"],
  [/\bmisalnya\b/g, "sebagai contoh"],
  [/\bdetail\b/g, "terperinci"],
  [/\bDetail\b/g, "Terperinci"],
  [/\brincian\b/g, "perincian"],
  [/\bRincian\b/g, "Perincian"],
  [/\bpresentasi\b/g, "pembentangan"],
  [/\bAhli Waris\b/g, "Waris"],
  [/\bAyah\b/g, "Bapa"],
  [/\bayah\b/g, "bapa"],
  [/\bIbu\b/g, "Ibu"],
  [/\bIstri\b/g, "Isteri"],
  [/\bistri\b/g, "isteri"],
  [/\bSuami\b/g, "Suami"],
  [/\bAnak Laki-laki\b/g, "Anak Lelaki"],
  [/\bAnak Perempuan\b/g, "Anak Perempuan"],
  [/\bSaudara Laki-laki\b/g, "Saudara Lelaki"],
  [/\bsaudara laki-laki\b/g, "saudara lelaki"],
  [/\blaki-laki\b/g, "lelaki"],
  [/\bLaki-laki\b/g, "Lelaki"],
  [/\bperempuan\b/g, "perempuan"],
  [/\bPerempuan\b/g, "Perempuan"],
  [/\bCucu Laki-laki\b/g, "Cucu Lelaki"],
  [/\bSeibu\b/g, "Seibu"],
  [/\bSeayah\b/g, "Sebapa"],
  [/\bseibu\b/g, "seibu"],
  [/\bseayah\b/g, "sebapa"],
  [/\borang tua\b/g, "ibu bapa"],
  [/\bOrang Tua\b/g, "Ibu Bapa"],
  [/\bUtang\b/g, "Hutang"],
  [/\butang\b/g, "hutang"],
  [/\bBiaya\b/g, "Kos"],
  [/\bbiaya\b/g, "kos"],
  [/\bpemakaman\b/g, "pengebumian"],
  [/\bPemakaman\b/g, "Pengebumian"],
  [/\bsuami\b/g, "suami"],
  [/\bpasangan\b/g, "pasangan"],
  [/\bPasangan\b/g, "Pasangan"],
  [/\bdaerah\b/g, "kawasan"],
  [/\bDaerah\b/g, "Kawasan"],
  [/\bnomor\b/g, "nombor"],
  [/\bNomor\b/g, "Nombor"],
  [/\bdaftar\b/g, "daftar"],
  [/\bcatatan\b/g, "nota"],
  [/\bCatatan\b/g, "Nota"],
  [/\bdihitung\b/g, "dikira"],
  [/\bdihitung\b/g, "dikira"],
  [/\bmenghitung\b/g, "mengira"],
  [/\bMenghitung\b/g, "Mengira"],
  [/\bdiwariskan\b/g, "diwarisi"],
  [/\bwarisan\b/g, "warisan"],
  [/\bWarisan\b/g, "Warisan"],
  [/\bPembagian\b/g, "Pembahagian"],
  [/\bpembagian\b/g, "pembahagian"],
  [/\bdibagikan\b/g, "dibahagikan"],
  [/\bdibagi\b/g, "dibahagikan"],
  [/\bmembagi\b/g, "membahagikan"],
  [/\bbagian\b/g, "bahagian"],
  [/\bBagian\b/g, "Bahagian"],
  [/\bukuran\b/g, "saiz"],
  [/\bUkuran\b/g, "Saiz"],
  [/\butama\b/g, "utama"],
  [/\bUtama\b/g, "Utama"],
  [/\bharta\b/g, "harta"],
  [/\bHarta\b/g, "Harta"],
  [/\bwasiat\b/g, "wasiat"],
  [/\bWasiat\b/g, "Wasiat"],
  [/\bmuktabar\b/g, "muktabar"],
  [/\bfikih\b/g, "fiqh"],
  [/\bSelamat datang\b/g, "Selamat datang"],
  [/\bringkas\b/g, "ringkas"],
  [/\bpraktis\b/g, "praktikal"],
  [/\bPraktis\b/g, "Praktikal"],
  [/\bcepat\b/g, "pantas"],
  [/\bCepat\b/g, "Pantas"],
  [/\bmobile\b/g, "mudah alih"],
  [/\bmencakup\b/g, "merangkumi"],
  [/\bmencakupi\b/g, "merangkumi"],
  [/\bmeliputi\b/g, "merangkumi"],
  [/\bpenjelasan\b/g, "penjelasan"],
  [/\bPenjelasan\b/g, "Penjelasan"],
  [/\bringkasan\b/g, "ringkasan"],
  [/\bPanduan\b/g, "Panduan"],
  [/\bpanduan\b/g, "panduan"],
  [/\bperhitungan\b/g, "pengiraan"],
  [/\baset\b/g, "aset"],
  [/\bAset\b/g, "Aset"],
  [/\btabungan\b/g, "simpanan"],
  [/\bTabungan\b/g, "Simpanan"],
  [/\bemas\b/g, "emas"],
  [/\bperak\b/g, "perak"],
  [/\busaha\b/g, "perniagaan"],
  [/\bUsaha\b/g, "Perniagaan"],
  [/\bbisnis\b/g, "perniagaan"],
  [/\bBisnis\b/g, "Perniagaan"],
  [/\bekspor\b/g, "eksport"],
  [/\bimpor\b/g, "import"],
  [/\bMuncul\b/g, "Muncul"],
  [/\bmuncul\b/g, "muncul"],
  [/\bMulai\b/g, "Mulakan"],
  [/\bmulai\b/g, "mulakan"],
  [/\bMengelola\b/g, "Mengurus"],
  [/\bmengelola\b/g, "mengurus"],
  [/\bdukungan\b/g, "sokongan"],
  [/\bDukungan\b/g, "Sokongan"],
  [/\bmendukung\b/g, "menyokong"],
  [/\bMendukung\b/g, "Menyokong"],
  [/\bdesa\b/g, "kampung"],
  [/\bDesa\b/g, "Kampung"],
  [/\btidak ada\b/g, "tiada"],
  [/\bTidak ada\b/g, "Tiada"],
  [/\bbergaya\b/g, "bergaya"],
  [/\bdarurat\b/g, "kecemasan"],
  [/\bDarurat\b/g, "Kecemasan"],
  [/\bjangka\b/g, "tempoh"],
  [/\bJangka\b/g, "Tempoh"],
  [/\bdaftar\b/g, "senarai"],
  [/\bdaftarkan\b/g, "daftarkan"],
  [/\bmenu\b/g, "menu"],
  [/\bsedang\b/g, "sedang"],
  [/\bsemoga\b/g, "semoga"],
  [/\bIslami\b/g, "Islam"],
  [/\bislami\b/g, "Islam"],
  [/\bSyariah\b/g, "Syariah"],
  [/\bMalaysia\b/g, "Malaysia"],
  [/\bMakkah\b/g, "Mekah"],
  [/\bMadinah\b/g, "Madinah"],
  [/\bzakat\b/g, "zakat"],
  [/\bZakat\b/g, "Zakat"],
  [/\bsedekah\b/g, "sedekah"],
  [/\bSedekah\b/g, "Sedekah"],
  [/\bpiutang\b/g, "hutang piutang"],
  [/\bemas\b/g, "emas"],
  [/\bperak\b/g, "perak"],
];

function idToMs(id: string): string {
  let out = id;
  for (const [pattern, replacement] of SUBSTITUTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

// Escape a string for embedding in TypeScript double-quoted string literal.
function escapeForTs(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Process a file: find every `{ en: "...", id: "..." }` (with optional trailing
// comma and trailing space) and inject `ms: "<derived>"` between id and the
// closing brace. Also handle multi-line variants.
function processFile(filepath: string): { changed: number } {
  const content = fs.readFileSync(filepath, "utf8");

  // We match:
  //   { en: "...", id: "..." }            (single-line, simple strings)
  //   { en: "...", id: "...", }           (with trailing comma)
  // Use a non-greedy capture of the inner content. Skip if `ms:` is already present.

  let changed = 0;

  // Pattern 1: single-line object literal with en + id
  const singleLine = /\{\s*en:\s*"((?:[^"\\]|\\.)*)",\s*id:\s*"((?:[^"\\]|\\.)*)"(\s*,?\s*)\}/g;
  let out = content.replace(singleLine, (match, en: string, id: string, tail: string) => {
    if (match.includes("ms:")) return match;
    const idValue = id.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const msValue = idToMs(idValue);
    const msEscaped = escapeForTs(msValue);
    changed++;
    return `{ en: "${en}", ms: "${msEscaped}", id: "${id}"${tail}}`;
  });

  // Pattern 2: multi-line — match the `id: "<...>"` line and insert a sibling
  // ms line above it. We only do this where the surrounding lines look like
  // an object literal with en+id (i.e. there is an en: line within ~6 lines
  // above and no existing ms: line in between).
  const lines = out.split("\n");
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    result.push(line);
    // Look for a line that is exactly an id-string line (multi-line case).
    const m = line.match(/^(\s*)id:\s*"((?:[^"\\]|\\.)*)"(,?)\s*$/);
    if (!m) continue;
    const [, indent, idLiteral, trailingComma] = m;
    // Confirm there is an en: line in the previous 6 lines and no ms: line yet.
    let sawEn = false;
    let sawMs = false;
    for (let j = i - 1; j >= Math.max(0, i - 8); j--) {
      const prev = lines[j];
      if (/^\s*ms:\s*"/.test(prev)) {
        sawMs = true;
        break;
      }
      if (/^\s*en:\s*"/.test(prev)) {
        sawEn = true;
        break;
      }
      // Stop if we crossed a separator
      if (/^\s*\},/.test(prev) || /^\s*\}/.test(prev)) break;
    }
    if (!sawEn || sawMs) continue;
    // Insert an ms line BEFORE this id line so order becomes en, ms, id.
    const idValue = idLiteral.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    const msValue = idToMs(idValue);
    const msEscaped = escapeForTs(msValue);
    // Pop the last line we pushed (the id line) and re-emit in correct order.
    result.pop();
    result.push(`${indent}ms: "${msEscaped}",`);
    result.push(line);
    changed++;
  }

  out = result.join("\n");

  if (changed > 0) fs.writeFileSync(filepath, out, "utf8");
  return { changed };
}

const files = [
  path.join(ROOT, "client/src/lib/i18n.ts"),
  path.join(ROOT, "client/src/config/seo.ts"),
  path.join(ROOT, "client/src/config/content.ts"),
];

let totalChanged = 0;
for (const f of files) {
  const { changed } = processFile(f);
  console.log(`[add-ms-locale] ${path.relative(ROOT, f)}: +${changed} ms entries`);
  totalChanged += changed;
}
console.log(`[add-ms-locale] total: ${totalChanged}`);
