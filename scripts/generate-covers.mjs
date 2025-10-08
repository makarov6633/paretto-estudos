// Generate simple SVG book covers for items without coverImageUrl
// Usage: node scripts/generate-covers.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const URL = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!URL) throw new Error("POSTGRES_URL not set");

const sql = postgres(URL);
const COVERS_DIR = path.join(process.cwd(), "public", "media", "covers");
fs.mkdirSync(COVERS_DIR, { recursive: true });

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
  const hue = h % 360;
  const hue2 = (h * 7) % 360;
  return {
    a: `hsl(${hue} 70% 18%)`,
    b: `hsl(${hue2} 70% 32%)`,
    accent: `hsl(${(hue + 40) % 360} 85% 60%)`,
  };
}

function xmlEscape(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrapText(text, maxCharsPerLine = 18) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxCharsPerLine) {
      lines.push(line.trim());
      line = w;
    } else {
      line += " " + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.slice(0, 4); // limit to 4 lines
}

function svgCover({ title, author, slug }) {
  const { a, b, accent } = pickColors(slug);
  const W = 1200,
    H = 1600;
  const lines = wrapText(title, 16);
  const authorLine = author ? author : "";
  const titleYStart = 620 - lines.length * 60;
  const titleLines = lines
    .map((l, i) => {
      const y = titleYStart + i * 120;
      return `<text x="100" y="${y}" font-family="'Plus Jakarta Sans', Inter, system-ui" font-size="120" font-weight="800" fill="white">${xmlEscape(l)}</text>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${a}"/>
      <stop offset="100%" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" rx="48" fill="url(#g)"/>
  <circle cx="240" cy="380" r="220" fill="${accent}" opacity="0.12"/>
  <circle cx="980" cy="300" r="160" fill="white" opacity="0.06"/>
  <rect x="100" y="560" width="1000" height="8" fill="white" opacity="0.12"/>
  ${titleLines}
  <text x="100" y="1480" font-family="Inter, system-ui" font-size="64" font-weight="600" fill="rgba(255,255,255,0.9)">${xmlEscape(authorLine)}</text>
</svg>`;
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

const run = async () => {
  const rows =
    await sql`select id, slug, title, author, "coverImageUrl" from "item"`;
  for (const r of rows) {
    if (r.coverImageUrl && r.coverImageUrl.length > 0) continue;
    const svg = svgCover({ title: r.title, author: r.author, slug: r.slug });
    const outPath = path.join(COVERS_DIR, `${r.slug}.svg`);
    fs.writeFileSync(outPath, svg, "utf-8");
    const url = publicUrlFor(outPath).replace(/\\/g, "/");
    await sql`update "item" set "coverImageUrl"=${"/" + url.split("/").slice(url.split("/").indexOf("media")).join("/")} where "id"=${r.id}`;
    console.log("Cover generated:", r.slug);
  }
  await sql.end();
};

run().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});













