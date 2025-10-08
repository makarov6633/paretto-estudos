// Generate items.json by scanning public/media/pdf and public/media/audio
// Usage: node scripts/generate-items-from-media.mjs
// Output: ./items.json

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, "public", "media", "pdf");
const AUDIO_DIR = path.join(ROOT, "public", "media", "audio");

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    console.warn(`[warn] Directory not found: ${p}`);
  }
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

function normalizeBaseName(file) {
  const base = path.parse(file).name;
  // Remove common prefixes
  const stripPrefixes = [
    "novos resumos_Resumo_Completo_",
    "Resumo_Completo_",
    "Resumo_Expandido_",
    "Resumo ",
  ];
  let name = base;
  for (const p of stripPrefixes) {
    if (name.startsWith(p)) name = name.slice(p.length);
  }
  return name.replace(/\s+/g, " ").replace(/[()]/g, "").replace(/__+/g, "_");
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

function relativePublicUrl(abs) {
  return abs
    .split(path.sep)
    .slice(abs.split(path.sep).indexOf("public") + 1)
    .join("/");
}

ensureDir(PDF_DIR);
ensureDir(AUDIO_DIR);

const pdfFiles = walkFiles(PDF_DIR).filter((f) => /\.(pdf)$/i.test(f));
const audioFiles = walkFiles(AUDIO_DIR).filter((f) =>
  /\.(mp3|wav|m4a|aac|ogg)$/i.test(f),
);

const bySlug = new Map();

for (const f of pdfFiles) {
  const base = normalizeBaseName(f);
  const slug = toSlug(base);
  const title = toTitle(base);
  const url = "/" + relativePublicUrl(f).replace(/\\/g, "/");
  const existing = bySlug.get(slug) || {
    slug,
    title,
    author: "Desconhecido",
    hasPdf: false,
    hasAudio: false,
  };
  existing.pdfUrl = url;
  existing.hasPdf = true;
  bySlug.set(slug, existing);
}

for (const f of audioFiles) {
  const base = normalizeBaseName(f);
  const slug = toSlug(base);
  const title = toTitle(base);
  const url = "/" + relativePublicUrl(f).replace(/\\/g, "/");
  const existing = bySlug.get(slug) || {
    slug,
    title,
    author: "Desconhecido",
    hasPdf: false,
    hasAudio: false,
  };
  existing.hasAudio = true;
  existing.audioTracks = [{ audioUrl: url, language: "pt-BR", voice: "Faber" }];
  bySlug.set(slug, existing);
}

const items = Array.from(bySlug.values()).map((v) => ({
  slug: v.slug,
  title: v.title,
  author: v.author,
  hasPdf: Boolean(v.hasPdf),
  hasAudio: Boolean(v.hasAudio),
  pdfUrl: v.pdfUrl,
  audioTracks: v.audioTracks,
}));

const outPath = path.join(ROOT, "items.json");
fs.writeFileSync(outPath, JSON.stringify({ items }, null, 2), "utf-8");
console.log(`Generated ${items.length} items -> ${outPath}`);
