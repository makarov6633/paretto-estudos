// Fill missing audio durations (durationMs) in the database by reading local files under public/
// Usage: node scripts/fill-audio-durations.mjs
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

let mm;
try {
  mm = await import("music-metadata");
} catch {
  console.error("[error] Missing dependency: music-metadata");
  console.error("Run: npm i music-metadata");
  process.exit(1);
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error(
    "[error] POSTGRES_URL (or DATABASE_URL) not set in environment",
  );
  process.exit(1);
}

const sql = postgres(url);

function toAbsFromAudioUrl(audioUrl) {
  const rel = String(audioUrl || "").replace(/^\/+/, "");
  return path.join(process.cwd(), "public", rel);
}

async function main() {
  const rows =
    await sql`select id, "audioUrl", coalesce("durationMs",0) as dur from "audio_track"`;
  let updated = 0;
  for (const r of rows) {
    if (Number(r.dur) > 0) continue;
    const abs = toAbsFromAudioUrl(r.audioUrl);
    if (!fs.existsSync(abs)) {
      console.warn("[warn] File not found for audioUrl:", r.audioUrl);
      continue;
    }
    try {
      const meta = await mm.parseFile(abs);
      const sec = Number(meta?.format?.duration) || 0;
      if (sec > 0) {
        const ms = Math.round(sec * 1000);
        await sql`update "audio_track" set "durationMs"=${ms} where id=${r.id}`;
        updated++;
        console.log("Updated duration:", r.audioUrl, `${ms}ms`);
      } else {
        console.warn("[warn] Could not determine duration for:", r.audioUrl);
      }
    } catch (e) {
      console.warn(
        "[warn] Failed to parse",
        r.audioUrl,
        String(e?.message || e),
      );
    }
  }
  console.log(`Done. Updated ${updated} track(s).`);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await sql.end();
  } catch {}
  process.exit(1);
});
