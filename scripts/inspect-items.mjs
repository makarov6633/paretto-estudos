import "dotenv/config";
import postgres from "postgres";

const slugs = process.argv.slice(2);
const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("POSTGRES_URL not set");
  process.exit(1);
}
const sql = postgres(url, { max: 1 });

async function main() {
  let rows;
  if (slugs.length) {
    rows =
      await sql`select slug, title, author, "coverImageUrl", "pdfUrl" from "item" where slug = any(${slugs}) order by slug`;
  } else {
    rows =
      await sql`select slug, title, author, "coverImageUrl", "pdfUrl" from "item" order by slug limit 50`;
  }
  console.log(JSON.stringify(rows, null, 2));
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
