import "dotenv/config";
import postgres from "postgres";

const slugs = process.argv.slice(2);
if (!slugs.length) {
  console.error("Usage: node scripts/check-sync-for.mjs <slug1> [slug2 ...]");
  process.exit(1);
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  try {
    const rows = await sql`
      select i.slug, s.granularity, coalesce(jsonb_array_length(s.data),0) as points
      from "sync_map" s join "item" i on i.id=s."itemId"
      where i.slug = any(${sql.array(slugs, "text")})`;
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await sql.end(); } catch {}
  process.exit(1);
});

