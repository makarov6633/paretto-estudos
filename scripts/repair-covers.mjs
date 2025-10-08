// Ensure every item has a working cover file and DB url pointing to existing file
// Strategy: if coverImageUrl points to a missing file -> try fetch (Open Library/Google), else generate SVG fallback
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const sqlUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!sqlUrl) {
  console.error("[error] POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(sqlUrl);

// CLI flags for targeted/themed regeneration
const FORCE = process.argv.includes("--force");
const FORCE_THEMED = process.argv.includes("--force-themed");
const ONLY =
  (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";

const COVERS_DIR = path.join(process.cwd(), "public", "media", "covers");
fs.mkdirSync(COVERS_DIR, { recursive: true });

function fileExistsForUrl(url) {
  if (!url) return false;
  const rel = String(url).replace(/^\/+/, "");
  const abs = path.join(process.cwd(), "public", rel);
  return fs.existsSync(abs);
}

function sanitize(name) {
  return String(name).replace(/[^a-z0-9._-]+/gi, "_");
}

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTheme(title, author) {
  const t = norm(title + " " + (author || ""));
  if (
    /(neuro|cerebro|brain|sapolsky|biologia|biology|behave|determined)/.test(t)
  )
    return "neuro";
  if (/(econom|capital|market|finance|money|wealth)/.test(t)) return "economy";
  if (/(psico|jung|freud|psycho|psych)/.test(t)) return "psych";
  return "generic";
}

async function fetchOpenLibrary(title, author) {
  const q = new URL("https://openlibrary.org/search.json");
  q.searchParams.set("title", title);
  if (author) q.searchParams.set("author", author);
  q.searchParams.set("limit", "1");
  try {
    const r = await fetch(q.toString(), {
      headers: { "User-Agent": "ParettoEstudos/1.0" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const doc = Array.isArray(j.docs) && j.docs[0] ? j.docs[0] : null;
    const coverId = doc?.cover_i;
    if (!coverId) return null;
    const imgUrl = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    const img = await fetch(imgUrl);
    if (!img.ok) return null;
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 8192) return null; // avoid tiny placeholder images
    return { buffer: buf, ext: ".jpg", source: "openlibrary" };
  } catch {
    return null;
  }
}

async function fetchGoogleBooks(title, author) {
  const key = process.env.GOOGLE_BOOKS_API_KEY || "";
  const q = new URL("https://www.googleapis.com/books/v1/volumes");
  const query = `intitle:${title}${author ? " inauthor:" + author : ""}`;
  q.searchParams.set("q", query);
  q.searchParams.set("maxResults", "1");
  if (key) q.searchParams.set("key", key);
  try {
    const r = await fetch(q.toString());
    if (!r.ok) return null;
    const j = await r.json();
    const item = Array.isArray(j.items) && j.items[0] ? j.items[0] : null;
    const link =
      item?.volumeInfo?.imageLinks?.thumbnail ||
      item?.volumeInfo?.imageLinks?.small ||
      null;
    if (!link) return null;
    const hi = String(link)
      .replace("http://", "https://")
      .replace("&edge=curl", "")
      .replace("zoom=1", "zoom=2");
    const img = await fetch(hi);
    if (!img.ok) return null;
    const ct = img.headers.get("content-type") || "";
    const ext = ct.includes("png") ? ".png" : ".jpg";
    const buf = Buffer.from(await img.arrayBuffer());
    if (buf.length < 8192) return null; // avoid tiny placeholder images
    return { buffer: buf, ext, source: "google" };
  } catch {
    return null;
  }
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}
function pickColors(slug) {
  const h = hashString(slug);
  return {
    a: `hsl(${h % 360} 70% 18%)`,
    b: `hsl(${(h * 7) % 360} 70% 32%)`,
    accent: `hsl(${(h + 40) % 360} 85% 60%)`,
  };
}
function xmlEscape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function wrapText(text, max = 18) {
  const words = String(text).split(/\s+/);
  const out = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      out.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) out.push(line.trim());
  return out.slice(0, 4);
}
function svgCover({ title, author, slug, theme = "generic" }) {
  const { a, b, accent } = pickColors(slug);
  const W = 1200,
    H = 1600;
  const lines = wrapText(title, 16);
  const titleYStart = 620 - lines.length * 60;
  const titleLines = lines
    .map(
      (l, i) =>
        `<text x="100" y="${titleYStart + i * 120}" font-family="'Plus Jakarta Sans', Inter, system-ui" font-size="120" font-weight="800" fill="white">${xmlEscape(l)}</text>`,
    )
    .join("\n");
  const motif =
    theme === "neuro"
      ? `<g opacity="0.18" stroke="${accent}" stroke-width="6">
         <circle cx="900" cy="520" r="90" fill="none"/>
         <circle cx="760" cy="680" r="70" fill="none"/>
         <circle cx="1030" cy="700" r="55" fill="none"/>
         <line x1="900" y1="520" x2="760" y2="680" />
         <line x1="900" y1="520" x2="1030" y2="700" />
         <line x1="760" y1="680" x2="1030" y2="700" />
       </g>`
      : theme === "economy"
        ? `<g opacity="0.16" stroke="${accent}" stroke-width="8">
         <polyline points="140,1200 360,980 560,1050 820,820 1040,900" fill="none"/>
       </g>`
        : theme === "psych"
          ? `<g opacity="0.16" fill="${accent}">
         <rect x="980" y="350" width="24" height="120" rx="6" />
         <rect x="1012" y="330" width="24" height="160" rx="6" />
         <rect x="1044" y="360" width="24" height="100" rx="6" />
       </g>`
          : "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">\n  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${a}"/><stop offset="100%" stop-color="${b}"/></linearGradient></defs>\n  <rect width="100%" height="100%" rx="48" fill="url(#g)"/>\n  <circle cx="240" cy="380" r="220" fill="${accent}" opacity="0.12"/>\n  <circle cx="980" cy="300" r="160" fill="white" opacity="0.06"/>\n  ${motif}\n  <rect x="100" y="560" width="1000" height="8" fill="white" opacity="0.12"/>\n  ${titleLines}\n  <text x="100" y="1480" font-family="Inter, system-ui" font-size="64" font-weight="600" fill="rgba(255,255,255,0.9)">${xmlEscape(author || "")}</text>\n</svg>`;
}

async function main() {
  const items =
    await sql`select id, slug, title, author, "coverImageUrl" from "item" order by "createdAt" asc`;
  let fixed = 0;
  for (const it of items) {
    if (ONLY && it.slug !== ONLY) continue;
    const ok = fileExistsForUrl(it.coverImageUrl);
    if (ok && !FORCE && !FORCE_THEMED) continue;
    // try online
    const tNorm = norm(it.title);
    const aNorm = norm(it.author || "");
    let got = null;
    if (!FORCE_THEMED) {
      got = await fetchOpenLibrary(tNorm, aNorm);
      if (!got) got = await fetchOpenLibrary(tNorm, "");
      if (!got) got = await fetchGoogleBooks(tNorm, aNorm);
      if (!got) got = await fetchGoogleBooks(tNorm, "");
    }

    let filename, publicUrl;
    if (got) {
      filename = sanitize(`${it.slug}${got.ext}`);
      fs.writeFileSync(path.join(COVERS_DIR, filename), got.buffer);
      publicUrl = "/media/covers/" + filename;
    } else {
      // fallback svg
      filename = sanitize(`${it.slug}.svg`);
      const theme = detectTheme(it.title, it.author);
      fs.writeFileSync(
        path.join(COVERS_DIR, filename),
        svgCover({ title: it.title, author: it.author, slug: it.slug, theme }),
        "utf-8",
      );
      publicUrl = "/media/covers/" + filename;
    }
    await sql`update "item" set "coverImageUrl"=${publicUrl} where id=${it.id}`;
    fixed++;
    console.log("repaired cover:", it.slug);
    await new Promise((r) => setTimeout(r, 120));
  }
  console.log(`Done. Repaired ${fixed} cover(s).`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
