import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  try {
    const n = await sql`select count(*)::int as n from "sync_map"`;
    console.log("sync_map rows:", n?.[0]?.n ?? 0);
    const few = await sql`
      select i.slug, s.granularity, coalesce(jsonb_array_length(s.data),0) as points
      from "sync_map" s join "item" i on i.id = s."itemId"
      order by s.id desc limit 10`;
    console.log(JSON.stringify(few, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await sql.end(); } catch {}
  process.exit(1);
});

