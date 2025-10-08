// Ingest local media from a source folder, copy into public/, and generate items.json
// Usage: node scripts/ingest-from-folder.mjs [SOURCE_DIR]
// Default SOURCE_DIR: ./resumos e audio

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR =
  process.argv.slice(2).join(" ") || path.join(ROOT, "resumos e audio");
const OUT_PDF_DIR = path.join(ROOT, "public", "media", "pdf");
const OUT_AUDIO_DIR = path.join(ROOT, "public", "media", "audio");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function normalizeBaseName(file) {
  const base = path.parse(file).name;
  const strip = [
    "novos resumos_Resumo_Completo_",
    "Resumo_Completo_",
    "Resumo_Expandido_",
    "Resumo ",
  ];
  let s = base;
  for (const p of strip) if (s.startsWith(p)) s = s.slice(p.length);
  return s.replace(/\s+/g, " ").replace(/[()]/g, "").replace(/__+/g, "_");
}

function toSlug(s) {
  return s
    .toLowerCase()
    .replace(/[áàâã]/g, "a")
    .replace(/[éê]/g, "e")
    .replace(/[í]/g, "i")
    .replace(/[óôõ]/g, "o")
    .replace(/[ú]/g, "u")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toTitle(s) {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      w.length <= 2 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1),
    )
    .join(" ");
}

function copyFileSafe(src, destDir, newBase) {
  ensureDir(destDir);
  const ext = path.extname(src).toLowerCase();
  const dest = path.join(destDir, `${newBase}${ext}`);
  fs.copyFileSync(src, dest);
  return dest;
}

function publicUrlFor(abs) {
  return (
    "/" +
    abs
      .split(path.sep)
      .slice(abs.split(path.sep).indexOf("public") + 1)
      .join("/")
  );
}

// ---- MAIN ----
if (!fs.existsSync(SRC_DIR)) {
  console.error(`[error] Source folder not found: ${SRC_DIR}`);
  process.exit(1);
}

const files = walk(SRC_DIR);
const pdfs = files.filter((f) => /\.(pdf)$/i.test(f));
const audios = files.filter((f) => /\.(wav|mp3|m4a|aac|ogg)$/i.test(f));

const bySlug = new Map();

for (const f of pdfs) {
  const base = normalizeBaseName(f);
  const slug = toSlug(base);
  const title = toTitle(base);
  const out = copyFileSafe(f, OUT_PDF_DIR, slug);
  const url = publicUrlFor(out);
  const it = bySlug.get(slug) || {
    slug,
    title,
    author: "Desconhecido",
    hasPdf: false,
    hasAudio: false,
  };
  it.pdfUrl = url;
  it.hasPdf = true;
  bySlug.set(slug, it);
}

for (const f of audios) {
  const base = normalizeBaseName(f);
  const slug = toSlug(base);
  const title = toTitle(base);
  const out = copyFileSafe(f, OUT_AUDIO_DIR, slug);
  const url = publicUrlFor(out);
  const it = bySlug.get(slug) || {
    slug,
    title,
    author: "Desconhecido",
    hasPdf: false,
    hasAudio: false,
  };
  it.hasAudio = true;
  it.audioTracks = [{ audioUrl: url, language: "pt-BR", voice: "Faber" }];
  bySlug.set(slug, it);
}

const items = Array.from(bySlug.values());
const outPath = path.join(ROOT, "items.json");
fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2));
console.log(`Ingested ${items.length} items from '${SRC_DIR}'.`);
console.log(
  `Assets copied into public/media and items.json written at ${outPath}`,
);
