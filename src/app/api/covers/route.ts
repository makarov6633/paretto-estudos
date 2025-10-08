import { NextResponse } from "next/server";
import { promises as fsp } from "node:fs";
import fs from "node:fs";
import path from "node:path";

const ALLOWED = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

// Simple in-memory cache to avoid repeated FS scans
let cache: { images: string[]; exp: number } | null = null;
const TTL_MS = 60_000; // 60s

export async function GET() {
  try {
    const now = Date.now();
    if (cache && cache.exp > now) {
      return NextResponse.json(
        { images: cache.images },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } },
      );
    }
    const dir = path.join(process.cwd(), "public", "media", "covers");
    if (!fs.existsSync(dir))
      return NextResponse.json(
        { images: [] },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } },
      );
    const files = (await fsp.readdir(dir)).filter((f) =>
      ALLOWED.has(path.extname(f).toLowerCase()),
    );
    const images = files
      .sort()
      .map((f) => `/media/covers/${encodeURIComponent(f)}`);
    cache = { images, exp: now + TTL_MS };
    return NextResponse.json(
      { images },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60" } },
    );
  } catch {
    return NextResponse.json(
      { images: [] },
      { headers: { "Cache-Control": "public, s-maxage=30" } },
    );
  }
}
