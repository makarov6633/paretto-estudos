import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type ItemLite = {
  id?: string;
  slug?: string;
  title?: string;
  author?: string;
  coverImageUrl?: string | null;
  hasPdf?: boolean;
  hasAudio?: boolean;
  pdfUrl?: string | null;
  audioTracks?: Array<{ audioUrl: string }> | null;
};

function normalizeTitle(s: unknown): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function loadItems(): Promise<ItemLite[]> {
  // Use items.json when present; otherwise return empty and rely solely on file scan.
  try {
    const p = path.join(process.cwd(), "items.json");
    if (fs.existsSync(p)) {
      const json = JSON.parse(fs.readFileSync(p, "utf-8"));
      return Array.isArray(json.items) ? (json.items as ItemLite[]) : [];
    }
  } catch {}
  return [];
}

export async function GET(req: Request) {
  // Require admin secret in production
  const secret =
    process.env.ADMIN_API_SECRET || process.env.ADMIN_IMPORT_SECRET || "";
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && secret) {
    const provided = new Headers(req.headers).get("x-admin-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  const items = await loadItems();

  const coversDir = path.join(process.cwd(), "public", "media", "covers");
  const pdfDir = path.join(process.cwd(), "public", "media", "pdf");
  const audioDir = path.join(process.cwd(), "public", "media", "audio");
  const covers = fs.existsSync(coversDir)
    ? new Set(fs.readdirSync(coversDir).map((f) => f.toLowerCase()))
    : new Set<string>();
  const pdfs = fs.existsSync(pdfDir)
    ? new Set(fs.readdirSync(pdfDir).map((f) => f.toLowerCase()))
    : new Set<string>();
  const audios = fs.existsSync(audioDir)
    ? new Set(fs.readdirSync(audioDir).map((f) => f.toLowerCase()))
    : new Set<string>();

  const duplicates: Array<{ key: string; titles: string[]; slugs: string[] }> =
    [];
  const seen = new Map<string, { titles: string[]; slugs: string[] }>();

  const missing = {
    cover: [] as string[],
    pdf: [] as string[],
    audio: [] as string[],
  };

  for (const it of items) {
    const key = normalizeTitle(it.title);
    const group = seen.get(key) || { titles: [], slugs: [] };
    group.titles.push(it.title || "");
    if (it.slug) group.slugs.push(it.slug);
    seen.set(key, group);

    const slug = (it.slug || "").toLowerCase();
    // Cover check
    const hasCover = it.coverImageUrl
      ? true
      : [...covers].some((f) => f.includes(slug));
    if (!hasCover) missing.cover.push(slug || it.title || "");

    // PDF check
    const pdfOk = it.pdfUrl
      ? true
      : [...pdfs].some((f) => f.includes(slug) && f.endsWith(".pdf"));
    if (it.hasPdf && !pdfOk) missing.pdf.push(slug || it.title || "");

    // Audio check
    const audioOk =
      it.audioTracks && it.audioTracks.length > 0
        ? true
        : [...audios].some((f) => f.includes(slug));
    if (it.hasAudio && !audioOk) missing.audio.push(slug || it.title || "");
  }

  for (const [key, g] of seen.entries()) {
    if (g.slugs.length > 1)
      duplicates.push({ key, titles: g.titles, slugs: g.slugs });
  }

  return NextResponse.json({
    totalItems: items.length,
    duplicates,
    missing,
    coversCount: covers.size,
    pdfCount: pdfs.size,
    audioCount: audios.size,
  });
}
