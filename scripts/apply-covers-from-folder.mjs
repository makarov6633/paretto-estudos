// Apply covers from ./imagens/new_different_covers into public/media/covers and update DB
// Usage: node scripts/apply-covers-from-folder.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "imagens", "new_different_covers");
const OUT = path.join(ROOT, "public", "media", "covers");

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error("POSTGRES_URL not set");
const sql = postgres(url);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function toSlug(s) {
  return String(s)
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

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("[error] Covers folder not found:", SRC);
    process.exit(1);
  }
  ensureDir(OUT);

  const files = fs
    .readdirSync(SRC)
    .filter((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  const items =
    await sql`select id, slug, title, "coverImageUrl" from "item" order by "createdAt" asc`;
  let queue = items.filter((it) => !it.coverImageUrl);

  let updated = 0;
  let qIdx = 0;
  for (const f of files) {
    const base = path.parse(f).name;
    const guessedSlug = toSlug(base);
    let row = items.find((it) => it.slug === guessedSlug);
    if (!row) {
      // try title match
      row = items.find((it) => toSlug(it.title) === guessedSlug);
    }
    if (!row) {
      // fallback: assign sequentially to next item missing a cover
      const next = queue[qIdx];
      if (next) {
        row = next;
        qIdx++;
      } else {
        console.warn(
          "[warn] No item match and no items without cover left:",
          f,
        );
        continue;
      }
    }
    const ext = path.extname(f).toLowerCase();
    const dest = path.join(OUT, `${row.slug}${ext}`);
    fs.copyFileSync(path.join(SRC, f), dest);
    const publicUrl = "/media/covers/" + `${row.slug}${ext}`;
    await sql`update "item" set "coverImageUrl"=${publicUrl} where id=${row.id}`;
    updated++;
    console.log("Cover applied:", row.slug);
  }

  console.log(`Done. Applied ${updated} cover(s).`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
