// Enrich items.json with sections extracted from PDFs for better syncing/reading
// Usage: node scripts/generate-sections-from-pdf.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

async function loadPdfParser() {
  try {
    // Import internal module to avoid index.js debug side-effects
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    return mod.default || mod;
  } catch {
    console.error("[error] Missing or incompatible dependency: pdf-parse");
    console.error("Run: npm i pdf-parse");
    process.exit(1);
  }
}

function readItemsJson() {
  const p = path.join(ROOT, "items.json");
  if (!fs.existsSync(p)) {
    console.error("[error] items.json not found. Run ingest first.");
    process.exit(1);
  }
  const raw = fs.readFileSync(p, "utf-8");
  return { p, json: JSON.parse(raw) };
}

function toAbsFromPublicUrl(url) {
  const rel = String(url || "").replace(/^\/+/, "");
  return path.join(ROOT, "public", rel);
}

function normalizeText(txt) {
  // Keep paragraph boundaries if possible
  const clean = txt
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[\u00A0\u200B]/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return clean;
}

function splitIntoParagraphs(txt) {
  const blocks = txt
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  // further split long blocks
  const out = [];
  for (const b of blocks) {
    if (b.length > 800) {
      const parts = b.split(/(?<=[\.!\?])\s+/g);
      let cur = "";
      for (const sent of parts) {
        if ((cur + " " + sent).trim().length > 400) {
          out.push(cur.trim());
          cur = sent;
        } else {
          cur += " " + sent;
        }
      }
      if (cur.trim()) out.push(cur.trim());
    } else {
      out.push(b);
    }
  }
  return out;
}

function chunkParagraphsToSections(paragraphs, targetSections = 8) {
  if (paragraphs.length === 0) return [];
  const K = Math.max(
    3,
    Math.min(targetSections, Math.ceil(paragraphs.length / 3)),
  );
  const per = Math.ceil(paragraphs.length / K);
  const sections = [];
  for (let i = 0; i < K; i++) {
    const slice = paragraphs.slice(i * per, (i + 1) * per);
    if (!slice.length) continue;
    const html = slice.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
    sections.push({ orderIndex: i, heading: undefined, contentHtml: html });
  }
  return sections;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function countWords(s) {
  return (s.match(/\b\w+\b/g) || []).length;
}

async function main() {
  const pdfParse = await loadPdfParser();
  const { p: itemsPath, json } = readItemsJson();
  const items = Array.isArray(json.items) ? json.items : [];
  let enriched = 0;

  for (const it of items) {
    if (!it?.pdfUrl) continue;
    const abs = toAbsFromPublicUrl(it.pdfUrl);
    if (!fs.existsSync(abs)) continue;
    try {
      const data = fs.readFileSync(abs);
      const parsed = await pdfParse(data);
      const text = normalizeText(parsed.text || "");
      const paras = splitIntoParagraphs(text);
      const sections = chunkParagraphsToSections(paras, 10);
      if (sections.length > 0) {
        it.sections = sections;
        // estimate reading minutes if missing
        if (!it.readingMinutes) {
          const wc = countWords(text);
          it.readingMinutes = Math.max(3, Math.round(wc / 200));
        }
        enriched++;
      }
    } catch (e) {
      console.warn(
        "[warn] PDF parse failed for",
        it.slug,
        "-",
        String(e?.message || e),
      );
    }
  }

  fs.writeFileSync(itemsPath, JSON.stringify({ items }, null, 2), "utf-8");
  console.log(
    `Sections enriched for ${enriched} item(s). Updated ${itemsPath}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
