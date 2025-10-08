// Deduplicate items by normalized title and normalize media filenames by slug.
// Usage:
//   node scripts/fix-duplicates-and-media.mjs --apply   # applies DB/file changes
//   node scripts/fix-duplicates-and-media.mjs           # dry-run (no changes)
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

const DIRS = {
  covers: path.join(process.cwd(), "public", "media", "covers"),
  pdf: path.join(process.cwd(), "public", "media", "pdf"),
  audio: path.join(process.cwd(), "public", "media", "audio"),
};
for (const d of Object.values(DIRS)) fs.mkdirSync(d, { recursive: true });

function normTitle(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function pickCanonical(items) {
  // Prefer richer media; tie-breaker earliest createdAt
  const score = (r) =>
    (r.hasPdf ? 2 : 0) + (r.hasAudio ? 2 : 0) + (r.coverImageUrl ? 1 : 0);
  return [...items].sort((a, b) => {
    const s = score(b) - score(a);
    if (s) return s;
    const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ad - bd;
  })[0];
}

function findFileBySlug(dir, slug, exts) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const lower = slug.toLowerCase();
  const matches = files.filter((f) => f.toLowerCase().includes(lower));
  // Prefer desired extension ordering
  for (const ext of exts) {
    const m = matches.find((f) => f.toLowerCase().endsWith(ext));
    if (m) return path.join(dir, m);
  }
  return matches[0] ? path.join(dir, matches[0]) : null;
}

function renameIfNeeded(absPath, destAbs) {
  if (!absPath) return { changed: false };
  if (!fs.existsSync(absPath)) return { changed: false };
  if (path.resolve(absPath) === path.resolve(destAbs))
    return { changed: false };
  if (fs.existsSync(destAbs)) {
    // If destination exists, keep the existing one and remove the source duplicate only if identical name ignoring case
    return { changed: false, note: "dest-exists-skip" };
  }
  if (APPLY) fs.renameSync(absPath, destAbs);
  return { changed: true };
}

async function main() {
  const backupDir = path.join(process.cwd(), "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  const items =
    await sql`select id, slug, title, author, "coverImageUrl", "pdfUrl", "hasPdf", "hasAudio", "createdAt" from "item" order by "createdAt" asc`;

  // Group by normalized title
  const groups = new Map();
  for (const it of items) {
    const key = normTitle(it.title);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(it);
  }

  const actions = { duplicates: [], mediaRenames: [] };

  // Deduplicate
  for (const [key, arr] of groups.entries()) {
    if (arr.length <= 1) continue;
    const keep = pickCanonical(arr);
    const remove = arr.filter((r) => r.id !== keep.id);
    const entry = { key, keepId: keep.id, removeIds: remove.map((r) => r.id) };
    actions.duplicates.push(entry);
    if (APPLY) {
      // Re-point children
      for (const r of remove) {
        await sql.begin(async (trx) => {
          await trx`update "audio_track" set "itemId"=${keep.id} where "itemId"=${r.id}`;
          await trx`update "summary_section" set "itemId"=${keep.id} where "itemId"=${r.id}`;
          await trx`update "sync_map" set "itemId"=${keep.id} where "itemId"=${r.id}`;
          await trx`update "reading_event" set "itemId"=${keep.id} where "itemId"=${r.id}`.catch(
            () => {},
          );
          await trx`delete from "item" where "id"=${r.id}`;
        });
      }
    }
  }

  // Media normalization per remaining items (reload after dedupe if applied)
  const items2 = APPLY
    ? await sql`select id, slug, title, author, "coverImageUrl", "pdfUrl", "hasPdf", "hasAudio" from "item"`
    : items;

  for (const it of items2) {
    // Cover
    const coverExisting = it.coverImageUrl
      ? path.join(
          process.cwd(),
          "public",
          String(it.coverImageUrl).replace(/^\/+/, ""),
        )
      : null;
    const coverFound =
      coverExisting && fs.existsSync(coverExisting)
        ? coverExisting
        : findFileBySlug(DIRS.covers, it.slug, [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp",
            ".svg",
          ]);
    if (coverFound) {
      const ext = path.extname(coverFound).toLowerCase() || ".jpg";
      const destAbs = path.join(DIRS.covers, `${it.slug}${ext}`);
      const res = renameIfNeeded(coverFound, destAbs);
      if (res.changed) {
        actions.mediaRenames.push({
          type: "cover",
          id: it.id,
          from: coverFound,
          to: destAbs,
        });
        if (APPLY)
          await sql`update "item" set "coverImageUrl"=${`/media/covers/${it.slug}${ext}`} where id=${it.id}`;
      }
    }

    // PDF
    const pdfFound = it.pdfUrl
      ? path.join(
          process.cwd(),
          "public",
          String(it.pdfUrl).replace(/^\/+/, ""),
        )
      : findFileBySlug(DIRS.pdf, it.slug, [".pdf"]);
    if (pdfFound) {
      const ext = path.extname(pdfFound).toLowerCase() || ".pdf";
      const destAbs = path.join(DIRS.pdf, `${it.slug}${ext}`);
      const res = renameIfNeeded(pdfFound, destAbs);
      if (res.changed) {
        actions.mediaRenames.push({
          type: "pdf",
          id: it.id,
          from: pdfFound,
          to: destAbs,
        });
        if (APPLY)
          await sql`update "item" set "pdfUrl"=${`/media/pdf/${it.slug}${ext}`} where id=${it.id}`;
      }
    }

    // Audio tracks
    const tracks =
      await sql`select id, "audioUrl" from "audio_track" where "itemId"=${it.id}`;
    for (const t of tracks) {
      const abs = t.audioUrl
        ? path.join(
            process.cwd(),
            "public",
            String(t.audioUrl).replace(/^\/+/, ""),
          )
        : findFileBySlug(DIRS.audio, it.slug, [".mp3", ".wav", ".m4a", ".ogg"]);
      if (!abs || !fs.existsSync(abs)) continue;
      const ext = path.extname(abs).toLowerCase() || ".wav";
      const destAbs = path.join(DIRS.audio, `${it.slug}${ext}`);
      const res = renameIfNeeded(abs, destAbs);
      if (res.changed) {
        actions.mediaRenames.push({
          type: "audio",
          id: it.id,
          trackId: t.id,
          from: abs,
          to: destAbs,
        });
        if (APPLY)
          await sql`update "audio_track" set "audioUrl"=${`/media/audio/${it.slug}${ext}`} where id=${t.id}`;
      }
    }
  }

  // items.json sync (optional)
  const itemsJsonPath = path.join(process.cwd(), "items.json");
  if (fs.existsSync(itemsJsonPath)) {
    const src = JSON.parse(fs.readFileSync(itemsJsonPath, "utf-8"));
    const list = Array.isArray(src.items) ? src.items : [];
    const byKey = new Map();
    const out = [];
    for (const it of list) {
      const key = normTitle(it.title);
      if (byKey.has(key)) continue; // drop duplicate in json
      byKey.set(key, true);
      // fix media urls to match slug naming if present
      const slug = it.slug;
      const cover = findFileBySlug(DIRS.covers, slug, [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".svg",
      ]);
      const pdf = findFileBySlug(DIRS.pdf, slug, [".pdf"]);
      const aud = findFileBySlug(DIRS.audio, slug, [
        ".mp3",
        ".wav",
        ".m4a",
        ".ogg",
      ]);
      const co = cover
        ? "/media/covers/" + path.basename(cover)
        : it.coverImageUrl;
      const pu = pdf ? "/media/pdf/" + path.basename(pdf) : it.pdfUrl;
      const at = aud
        ? [{ audioUrl: "/media/audio/" + path.basename(aud) }]
        : it.audioTracks;
      out.push({ ...it, coverImageUrl: co, pdfUrl: pu, audioTracks: at });
    }
    const backup = path.join(backupDir, `items-backup-${stamp}.json`);
    fs.writeFileSync(backup, JSON.stringify(src, null, 2));
    if (APPLY)
      fs.writeFileSync(itemsJsonPath, JSON.stringify({ items: out }, null, 2));
  }

  // persist action log
  const logPath = path.join(backupDir, `fix-duplicates-log-${stamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify({ apply: APPLY, actions }, null, 2));
  console.log(
    APPLY
      ? "[apply] Completed fixes."
      : "[dry-run] See planned actions in backups folder.",
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
