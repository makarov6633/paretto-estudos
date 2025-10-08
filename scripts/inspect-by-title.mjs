import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const terms = process.argv.slice(2);
const sql = postgres(url, { max: 1 });

async function main() {
  try {
    if (!terms.length) {
      console.error("Usage: node scripts/inspect-by-title.mjs <term1> [term2...]");
      process.exit(1);
    }
    const like = terms.map((t) => `%${t.toLowerCase()}%`);
    const clauses = like.map((_, i) => `lower(title) like $${i + 1}`).join(' OR ');
    const rows = await sql.unsafe(
      `select slug, title, "pdfUrl", "hasPdf" from "item" where ${clauses} order by "createdAt" desc limit 100`,
      like,
    );
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
