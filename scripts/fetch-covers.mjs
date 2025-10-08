// Fetch professional-looking covers from Google Books only (multiple strategies)
// Usage: node scripts/fetch-covers.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[error] POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url);

const OUT = path.join(process.cwd(), "public", "media", "covers");
fs.mkdirSync(OUT, { recursive: true });

function sanitizeFilename(name) {
  return String(name).replace(/[^a-z0-9._-]+/gi, "_");
}

function bestImageLinks(links = {}) {
  const order = [
    "extraLarge",
    "large",
    "medium",
    "small",
    "thumbnail",
    "smallThumbnail",
  ];
  for (const k of order) if (links[k]) return links[k];
  return null;
}

async function fetchGoogleBooks(title, author) {
  const key = process.env.GOOGLE_BOOKS_API_KEY || "";
  const base = "https://www.googleapis.com/books/v1/volumes";
  const queries = [
    `intitle:"${title}"${author ? ` inauthor:"${author}"` : ""}`,
    `${title} ${author || ""}`.trim(),
    `intitle:${title}`,
  ];
  for (const qstr of queries) {
    try {
      const u = new URL(base);
      u.searchParams.set("q", qstr);
      u.searchParams.set("maxResults", "5");
      if (key) u.searchParams.set("key", key);
      const r = await fetch(u.toString());
      if (!r.ok) continue;
      const j = await r.json();
      const items = Array.isArray(j.items) ? j.items : [];
      for (const it of items) {
        const link = bestImageLinks(it?.volumeInfo?.imageLinks || {});
        if (!link) continue;
        const hi = String(link)
          .replace("http://", "https://")
          .replace("&edge=curl", "")
          .replace("zoom=1", "zoom=2");
        const img = await fetch(hi);
        if (!img.ok) continue;
        const ct = img.headers.get("content-type") || "";
        const ext = ct.includes("png") ? ".png" : ".jpg";
        const buf = Buffer.from(await img.arrayBuffer());
        return { buffer: buf, ext, source: "google" };
      }
    } catch {}
  }
  return null;
}

async function main() {
  const rows =
    await sql`select id, slug, title, author, "coverImageUrl" from "item" order by "createdAt" asc`;
  let updated = 0;
  for (const it of rows) {
    if (it.coverImageUrl) continue;
    const title = String(it.title || "").trim();
    const author = String(it.author || "").trim();
    if (!title) continue;

    let result = await fetchGoogleBooks(title, author);
    if (!result) result = await fetchGoogleBooks(title, "");

    if (!result) {
      console.warn("[warn] no cover found for", it.slug);
      continue;
    }

    const filename = sanitizeFilename(`${it.slug}${result.ext}`);
    const dest = path.join(OUT, filename);
    fs.writeFileSync(dest, result.buffer);
    const publicUrl = "/media/covers/" + filename;
    await sql`update "item" set "coverImageUrl"=${publicUrl} where id=${it.id}`;
    updated++;
    console.log("cover fetched:", it.slug, "via", result.source);
    // Small politeness delay to avoid hammering APIs
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`Done. Updated ${updated} item(s).`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
