// Normalize titles/authors in DB for professional presentation
// Usage: node scripts/normalize-titles.mjs
import "dotenv/config";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error("POSTGRES_URL not set");
const sql = postgres(url);

function titleCase(s) {
  if (!s) return s;
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|\s|["'([{])([a-zà-ú])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}

function stripNoise(s) {
  if (!s) return s;
  let out = s
    .replace(
      /\b(resumo|completo|final|profissional|padronizado|reestruturado|reorganizado|corrigido|expandido|otimizado|vers[aã]o|v\d+)\b/gi,
      "",
    )
    .replace(/\b(95%|20%|\d+\s*min|cap[íi]tulo\s*\d+)\b/gi, "")
    .replace(/[–—-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Remove trailing markers in parentheses or dashes
  out = out
    .replace(/\s*\((?:[^)]*)\)\s*$/g, "")
    .replace(/\s*-\s*$/g, "")
    .trim();
  return out;
}

const run = async () => {
  const rows = await sql`select id, title, author from "item"`;
  for (const r of rows) {
    const nextTitle = titleCase(stripNoise(r.title));
    const nextAuthor = r.author ? titleCase(stripNoise(r.author)) : r.author;
    if (nextTitle !== r.title || nextAuthor !== r.author) {
      await sql`update "item" set "title"=${nextTitle}, "author"=${nextAuthor} where "id"=${r.id}`;
      console.log("Updated", r.id);
    }
  }
  await sql.end();
};
run().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
