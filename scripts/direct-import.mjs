// Directly import items.json into Postgres, bypassing API server
// Usage: node scripts/direct-import.mjs
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("[error] POSTGRES_URL (or DATABASE_URL) not set");
  process.exit(1);
}

const sql = postgres(url);

function readItems() {
  const p = path.join(process.cwd(), "items.json");
  if (!fs.existsSync(p)) {
    console.error("[error] items.json not found. Run ingest first.");
    process.exit(1);
  }
  const raw = fs.readFileSync(p, "utf-8");
  const json = JSON.parse(raw);
  return Array.isArray(json.items) ? json.items : [];
}

function cleanStr(v) {
  if (v == null) return null;
  const s = String(v);
  // remove null bytes and normalize whitespace
  return s.replace(/\u0000/g, "").replace(/\s+$/g, "");
}

async function main() {
  const items = readItems();
  const results = [];
  try {
    await sql.begin(async (tx) => {
      for (const raw of items) {
        const id = raw.id || crypto.randomUUID();
        try {
          const existing = await tx`
            select id from "item" where slug=${raw.slug}
          `;
          if (existing.length > 0) {
            await tx`delete from "item" where slug=${raw.slug}`; // cascades
          }

          await tx`
            insert into "item" (id, slug, title, author, language, "coverImageUrl", "pdfUrl", "hasAudio", "hasPdf", tags, "readingMinutes", "audioMinutes")
            values (${id}, ${cleanStr(raw.slug)}, ${cleanStr(raw.title)}, ${cleanStr(raw.author)}, ${cleanStr(raw.language || "pt-BR")}, ${cleanStr(raw.coverImageUrl) || null}, ${cleanStr(raw.pdfUrl) || null}, ${!!raw.hasAudio}, ${raw.hasPdf ?? Boolean(raw.pdfUrl)}, ${raw.tags ? tx.json(raw.tags) : null}, ${raw.readingMinutes || null}, ${raw.audioMinutes || null})
          `;

          if (Array.isArray(raw.sections) && raw.sections.length) {
            for (const [i, s] of raw.sections.entries()) {
              await tx`
                insert into "summary_section" (id, "itemId", "orderIndex", heading, "contentHtml")
                values (${s.id || crypto.randomUUID()}, ${id}, ${s.orderIndex ?? i}, ${cleanStr(s.heading) || null}, ${cleanStr(s.contentHtml) || null})
              `;
            }
          }

          if (Array.isArray(raw.audioTracks) && raw.audioTracks.length) {
            for (const t of raw.audioTracks) {
              await tx`
                insert into "audio_track" (id, "itemId", voice, language, "audioUrl", "durationMs")
                values (${t.id || crypto.randomUUID()}, ${id}, ${t.voice || null}, ${t.language || null}, ${t.audioUrl}, ${t.durationMs || null})
              `;
            }
          }

          if (raw.syncMap && (raw.syncMap.data || raw.syncMap.granularity)) {
            await tx`
              insert into "sync_map" (id, "itemId", granularity, data)
              values (${raw.syncMap.id || crypto.randomUUID()}, ${id}, ${raw.syncMap.granularity || null}, ${raw.syncMap.data ? tx.json(raw.syncMap.data) : null})
            `;
          }

          results.push({ slug: raw.slug, status: "imported" });
        } catch (e) {
          results.push({
            slug: raw.slug,
            status: "failed",
            error: String(e?.message || e),
          });
        }
      }
    });
  } finally {
    await sql.end();
  }
  console.log("Direct import results:", JSON.stringify(results, null, 2));
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
