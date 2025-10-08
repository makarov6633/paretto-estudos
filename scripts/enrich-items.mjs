// Enrich items with proper title/author using Open Library / Google Books.
// Falls back to heuristic normalization when offline. Updates DB and items.json.
// Usage:
//   node scripts/enrich-items.mjs            # dry-run
//   node scripts/enrich-items.mjs --apply    # apply changes
//   node scripts/enrich-items.mjs --only=<slug>
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
let pdfParse = null;
async function loadPdfParser() {
  if (pdfParse) return pdfParse;
  try {
    const mod = await import("pdf-parse/lib/pdf-parse.js");
    pdfParse = mod.default || mod;
    return pdfParse;
  } catch {
    return null;
  }
}

const APPLY = process.argv.includes("--apply");
const ONLY =
  (process.argv.find((a) => a.startsWith("--only=")) || "").split("=")[1] || "";

const sqlUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!sqlUrl) {
  console.error("[error] POSTGRES_URL (or DATABASE_URL) not set");
  process.exit(1);
}
const sql = postgres(sqlUrl, { max: 1 });

function norm(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function titleCase(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/(^|\s|["'([{])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase());
}
function stripNoise(s) {
  return String(s || "")
    .replace(
      /\b(resumo|completo|final|profissional|padronizado|reestruturado|reorganizado|corrigido|expandido|otimizado|vers[aã]o|v\d+)\b/gi,
      "",
    )
    .replace(/\b(95%|20%|\d+\s*min|cap[íi]tulo\s*\d+)\b/gi, "")
    .replace(/["'`~_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\s*\((?:[^)]*)\)\s*$/g, "")
    .replace(/\s*-\s*$/g, "")
    .trim();
}

async function queryOpenLibrary(title, author) {
  const q = new URL("https://openlibrary.org/search.json");
  if (title) q.searchParams.set("title", title);
  if (author) q.searchParams.set("author", author);
  q.searchParams.set("limit", "1");
  q.searchParams.set("language", "por");
  try {
    const r = await fetch(q.toString(), {
      headers: { "User-Agent": "ParettoEstudos/1.0" },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const doc = Array.isArray(j.docs) && j.docs[0] ? j.docs[0] : null;
    if (!doc) return null;
    const bestTitle = doc.title || doc.title_suggest;
    const auth = Array.isArray(doc.author_name)
      ? doc.author_name.join(", ")
      : doc.author_name || "";
    return { title: bestTitle, author: auth };
  } catch {
    return null;
  }
}

async function queryGoogleBooks(title, author) {
  const q = new URL("https://www.googleapis.com/books/v1/volumes");
  const key = process.env.GOOGLE_BOOKS_API_KEY || "";
  const query = `intitle:${title}${author ? " inauthor:" + author : ""}`;
  q.searchParams.set("q", query);
  q.searchParams.set("maxResults", "1");
  q.searchParams.set("langRestrict", "pt");
  if (key) q.searchParams.set("key", key);
  try {
    const r = await fetch(q.toString());
    if (!r.ok) return null;
    const j = await r.json();
    const it = Array.isArray(j.items) && j.items[0] ? j.items[0] : null;
    if (!it) return null;
    const vi = it.volumeInfo || {};
    const bestTitle = vi.title || "";
    const auth = Array.isArray(vi.authors)
      ? vi.authors.join(", ")
      : vi.authors || "";
    return { title: bestTitle, author: auth };
  } catch {
    return null;
  }
}

async function main() {
  const backupDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const items =
    await sql`select id, slug, title, author from "item" order by "createdAt" asc`;
  const actions = [];

  for (const it of items) {
    if (ONLY && it.slug !== ONLY) continue;
    const needsAuthor = !it.author || /desconhecido|unknown/i.test(it.author);
    const candidateTitle = stripNoise(it.title);
    let nextTitle = titleCase(candidateTitle);
    let nextAuthor = needsAuthor ? "" : it.author;

    // Online enrichment (best effort)
    const tQuery = norm(candidateTitle);
    const aQuery = needsAuthor ? "" : norm(it.author || "");
    let meta = null;
    try {
      meta = await queryOpenLibrary(tQuery, aQuery);
    } catch {}
    if (!meta) {
      try {
        meta = await queryGoogleBooks(tQuery, aQuery);
      } catch {}
    }

    if (meta) {
      if (meta.title) nextTitle = titleCase(meta.title);
      if (!nextAuthor && meta.author) nextAuthor = meta.author;
    }

    if (!nextAuthor) {
      // Offline heuristics
      // 1) split patterns
      const split1 = candidateTitle.split(" - ");
      if (split1.length > 1 && split1[1].length < 60)
        nextAuthor = titleCase(split1[1]);
      // 2) try PDF metadata
      if (!nextAuthor) {
        try {
          const pdfPath = path.join(
            process.cwd(),
            "public",
            "media",
            "pdf",
            `${it.slug}.pdf`,
          );
          if (fs.existsSync(pdfPath)) {
            const buf = fs.readFileSync(pdfPath);
            const parser = await loadPdfParser();
            const info = parser ? await parser(buf).catch(() => null) : null;
            const md = info && info.info ? info.info : {};
            const a = md.Author || md.creator || md["xmp:CreatorTool"] || "";
            if (a && String(a).length < 80) nextAuthor = titleCase(String(a));
            if (!nextTitle && md.Title) nextTitle = titleCase(String(md.Title));
          }
        } catch {}
      }
      if (!nextAuthor) nextAuthor = "Desconhecido";
    }

    const changed =
      (nextTitle && nextTitle !== it.title) ||
      (nextAuthor && nextAuthor !== it.author);
    if (changed) {
      actions.push({
        id: it.id,
        slug: it.slug,
        from: { title: it.title, author: it.author },
        to: { title: nextTitle, author: nextAuthor },
      });
      if (APPLY) {
        await sql`update "item" set "title"=${nextTitle}, "author"=${nextAuthor} where id=${it.id}`;
      }
    }
  }

  // items.json sync if present
  const itemsJsonPath = path.join(process.cwd(), "items.json");
  if (fs.existsSync(itemsJsonPath)) {
    const raw = fs.readFileSync(itemsJsonPath, "utf-8").replace(/^\uFEFF/, "");
    const src = JSON.parse(raw);
    const out = { items: [] };
    const byKey = new Map();
    for (const it of Array.isArray(src.items) ? src.items : []) {
      if (ONLY && it.slug !== ONLY) continue;
      const key = it.slug || norm(it.title);
      let title = titleCase(stripNoise(it.title));
      let author =
        it.author && !/desconhecido|unknown/i.test(it.author) ? it.author : "";
      let meta = null;
      try {
        meta = await queryOpenLibrary(norm(title), norm(author));
      } catch {}
      if (!meta) {
        try {
          meta = await queryGoogleBooks(norm(title), norm(author));
        } catch {}
      }
      if (meta) {
        title = meta.title ? titleCase(meta.title) : title;
        if (!author && meta.author) author = meta.author;
      }
      if (!author) author = "Desconhecido";
      const rec = { ...it, title, author };
      if (!byKey.has(key)) {
        byKey.set(key, true);
        out.items.push(rec);
      }
    }
    const backup = path.join(backupDir, `items-enrich-backup-${stamp}.json`);
    const raw2 = fs.readFileSync(itemsJsonPath, "utf-8").replace(/^\uFEFF/, "");
    fs.writeFileSync(backup, JSON.stringify(JSON.parse(raw2), null, 2));
    if (APPLY) fs.writeFileSync(itemsJsonPath, JSON.stringify(out, null, 2));
  }

  const logPath = path.join(backupDir, `enrich-items-log-${stamp}.json`);
  fs.writeFileSync(
    logPath,
    JSON.stringify(
      { apply: APPLY, actionsCount: actions.length, actions },
      null,
      2,
    ),
  );
  console.log(
    APPLY
      ? `[apply] Updated ${actions.length} item(s).`
      : `[dry-run] Planned ${actions.length} update(s).`,
  );
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
