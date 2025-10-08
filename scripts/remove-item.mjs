import "dotenv/config";
import postgres from "postgres";

const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node scripts/remove-item.mjs <slug>");
  process.exit(1);
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  const itemRows = await sql`select id from "item" where slug=${slug}`;
  if (!itemRows.length) {
    console.log("Item not found:", slug);
    return;
  }
  const id = itemRows[0].id;
  await sql`delete from "summary_section" where "itemId"=${id}`;
  await sql`delete from "audio_track" where "itemId"=${id}`;
  await sql`delete from "sync_map" where "itemId"=${id}`;
  await sql`delete from "reading_event" where "itemId"=${id}`;
  await sql`delete from "item" where id=${id}`;
  console.log("Removed item and related records:", slug);
}

main()
  .catch((err) => {
    console.error("Failed to remove item", err);
    process.exitCode = 1;
  })
  .finally(() => {
    sql.end();
  });
