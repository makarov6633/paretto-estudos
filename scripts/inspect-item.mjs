import "dotenv/config";
import postgres from "postgres";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/inspect-item.mjs <slug>");
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
    const it = await sql`select id, slug, title, "pdfUrl", "hasPdf" from "item" where slug=${slug}`;
    if (!it.length) {
      console.log("not found");
      return;
    }
    const id = it[0].id;
    const secs = await sql`select count(*)::int as n from "summary_section" where "itemId"=${id}`;
    const sm = await sql`select count(*)::int as n from "sync_map" where "itemId"=${id}`;
    console.log(JSON.stringify({ item: it[0], sections: secs[0].n, syncMaps: sm[0].n }, null, 2));
  } finally {
    await sql.end();
  }
}

main().catch(async (e) => {
  console.error(e);
  try { await sql.end(); } catch {}
  process.exit(1);
});

