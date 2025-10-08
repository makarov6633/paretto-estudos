// Targeted fix for specific items where we know authoritative metadata.
// Currently corrects Determined (Robert M. Sapolsky) after local verification.
// Usage: node scripts/fix-specific.mjs --apply
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const sqlUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!sqlUrl) {
  console.error("[error] POSTGRES_URL (or DATABASE_URL) not set");
  process.exit(1);
}
const sql = postgres(sqlUrl, { max: 1 });

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

async function verifyPdfContains(slug, ...needles) {
  try {
    const pdfPath = path.join(
      process.cwd(),
      "public",
      "media",
      "pdf",
      `${slug}.pdf`,
    );
    if (!fs.existsSync(pdfPath)) return false;
    const parser = await loadPdfParser();
    if (!parser) return false;
    const buf = fs.readFileSync(pdfPath);
    const parsed = await parser(buf).catch(() => null);
    const text = (parsed?.text || "").toLowerCase();
    return needles.every((n) => text.includes(String(n).toLowerCase()));
  } catch {
    return false;
  }
}

async function main() {
  const actions = [];

  // Authoritative corrections (Português-BR)
  const corrections = [
    {
      slug: "determined-resumo-completo-final",
      title: "Determined: Uma ciência da vida sem livre-arbítrio",
      author: "Robert M. Sapolsky",
      verifyNeedles: ["sapolsky", "determined"],
    },
    {
      slug: "a-sutil-arte-resumo-dissertativo",
      title: "A Sutil Arte de Ligar o Foda-se",
      author: "Mark Manson",
      verifyNeedles: ["mark", "manson", "sutil", "foda"],
    },
    {
      slug: "faca-seu-cerebro-trabalhar-para-voce",
      title: "Faça seu Cérebro Trabalhar para Você",
      author: "Renato Alves",
      verifyNeedles: ["renato", "alves", "cérebro"],
    },
    {
      slug: "oxford-handbook-psychology",
      title: "Manual Oxford de Psicologia",
      author: "Diversos autores",
      verifyNeedles: ["oxford", "psychology"],
    },
    {
      slug: "stress-and-your-body-sapolsky",
      title: "Estresse e Seu Corpo",
      author: "Robert M. Sapolsky",
      verifyNeedles: ["sapolsky", "stress"],
    },
  ];

  for (const c of corrections) {
    const rows =
      await sql`select id, slug, title, author from "item" where slug=${c.slug} limit 1`;
    if (!rows.length) continue;
    const it = rows[0];
    let verified = await verifyPdfContains(c.slug, ...c.verifyNeedles);
    const changed = it.title !== c.title || it.author !== c.author;
    if (changed) {
      actions.push({
        slug: c.slug,
        from: { title: it.title, author: it.author },
        to: { title: c.title, author: c.author },
        verified,
      });
      if (APPLY)
        await sql`update "item" set "title"=${c.title}, "author"=${c.author} where id=${it.id}`;
    }
    // items.json
    const itemsPath = path.join(process.cwd(), "items.json");
    if (fs.existsSync(itemsPath)) {
      const src = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
      let touched = false;
      if (Array.isArray(src.items)) {
        for (const rec of src.items) {
          if (rec.slug === c.slug) {
            if (rec.title !== c.title) {
              rec.title = c.title;
              touched = true;
            }
            if (rec.author !== c.author) {
              rec.author = c.author;
              touched = true;
            }
          }
        }
      }
      if (touched && APPLY) {
        const backup = path.join(
          process.cwd(),
          "backups",
          `items-specific-backup-${Date.now()}.json`,
        );
        try {
          fs.mkdirSync(path.dirname(backup), { recursive: true });
        } catch {}
        fs.writeFileSync(backup, JSON.stringify(src, null, 2));
        fs.writeFileSync(itemsPath, JSON.stringify(src, null, 2));
      }
    }
  }

  const logPath = path.join(
    process.cwd(),
    "backups",
    `fix-specific-${Date.now()}.json`,
  );
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
  } catch {}
  fs.writeFileSync(logPath, JSON.stringify({ apply: APPLY, actions }, null, 2));
  console.log(
    APPLY
      ? "[apply] Specific fixes applied."
      : "[dry-run] Specific fixes planned.",
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
