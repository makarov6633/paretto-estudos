// Generate approximate sync maps per section using audio duration and text length
// Usage: node scripts/generate-sync-maps.mjs
import "dotenv/config";
import crypto from "node:crypto";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error("POSTGRES_URL not set");
const sql = postgres(url);

function stripHtml(html) {
  return (html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const items = await sql`select i.id, i.slug from "item" i`;
  for (const it of items) {
    const secs =
      await sql`select id, "orderIndex", coalesce("contentHtml", '') as html from "summary_section" where "itemId"=${it.id} order by "orderIndex" asc`;
    if (secs.length === 0) continue;
    const tracks =
      await sql`select "audioUrl", coalesce("durationMs",0) as dur from "audio_track" where "itemId"=${it.id} limit 1`;
    if (tracks.length === 0) continue;
    const durationMs = Number(tracks[0].dur) || 0;
    if (durationMs <= 0) continue;
    const lengths = secs.map((s) => stripHtml(s.html).length || 1);
    const total = lengths.reduce((a, b) => a + b, 0);
    let acc = 0;
    const points = lengths.map((len, idx) => {
      const t = Math.round((acc / total) * durationMs);
      acc += len;
      return { t, i: idx };
    });
    await sql`delete from "sync_map" where "itemId"=${it.id}`;
    await sql`insert into "sync_map" (id, "itemId", "granularity", data) values (${crypto.randomUUID()}, ${it.id}, ${"line"}, ${sql.json(points)})`;
    console.log("Sync estimated:", it.slug, `(${points.length} pts)`);
  }
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});













