import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

async function ensurePdf(slug, relPath) {
  const it = await sql`select id from "item" where slug=${slug}`;
  if (!it.length) {
    console.log("skip, not found:", slug);
    return;
  }
  await sql`update "item" set "pdfUrl"=${relPath}, "hasPdf"=true where slug=${slug}`;
  console.log("pdf set:", slug, relPath);
}

async function removeAudio(slug) {
  const it = await sql`select id from "item" where slug=${slug}`;
  if (!it.length) {
    console.log("skip, not found:", slug);
    return;
  }
  const id = it[0].id;
  await sql`delete from "audio_track" where "itemId"=${id}`;
  console.log("audio removed:", slug);
}

async function addAudio(slug, relPath) {
  const it = await sql`select id from "item" where slug=${slug}`;
  if (!it.length) {
    console.log("skip, not found:", slug);
    return;
  }
  const id = it[0].id;
  const exists = await sql`select 1 from "audio_track" where "itemId"=${id} and "audioUrl"=${relPath} limit 1`;
  if (!exists.length)
    await sql`insert into "audio_track" (id, "itemId", "audioUrl") values (gen_random_uuid(), ${id}, ${relPath})`;
  console.log("audio set:", slug, relPath);
}

async function main() {
  const op = process.argv[2];
  if (op === "set-pdf") {
    const [slug, rel] = [process.argv[3], process.argv[4]];
    if (!slug || !rel) return console.error("Usage: node scripts/admin-fixes.mjs set-pdf <slug> <relPath>");
    await ensurePdf(slug, rel);
  } else if (op === "remove-audio") {
    const slug = process.argv[3];
    if (!slug) return console.error("Usage: node scripts/admin-fixes.mjs remove-audio <slug>");
    await removeAudio(slug);
  } else if (op === "add-audio") {
    const [slug, rel] = [process.argv[3], process.argv[4]];
    if (!slug || !rel) return console.error("Usage: node scripts/admin-fixes.mjs add-audio <slug> <relPath>");
    await addAudio(slug, rel);
  } else if (op === "set-cover") {
    const [slug, rel] = [process.argv[3], process.argv[4]];
    if (!slug || !rel) return console.error("Usage: node scripts/admin-fixes.mjs set-cover <slug> <relPath>");
    const it = await sql`select id from "item" where slug=${slug}`;
    if (!it.length) return console.error("not found", slug);
    await sql`update "item" set "coverImageUrl"=${rel} where slug=${slug}`;
    console.log("cover set:", slug, rel);
  } else {
    console.error("Usage:",
      "\n  node scripts/admin-fixes.mjs set-pdf <slug> <relPath>",
      "\n  node scripts/admin-fixes.mjs add-audio <slug> <relPath>",
      "\n  node scripts/admin-fixes.mjs remove-audio <slug>",
      "\n  node scripts/admin-fixes.mjs set-cover <slug> <relPath>");
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await sql.end(); } catch {}
  process.exit(1);
}).finally(async () => { try { await sql.end(); } catch {} });
