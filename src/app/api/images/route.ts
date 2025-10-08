import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dirParam = searchParams.get("dir")?.trim();

    // Prefer folder at project root: ./imagens (fallback)
    // If a directory is provided, serve from public/<dir> safely.
    let dir = path.join(process.cwd(), "imagens");
    if (dirParam) {
      // Basic sanitization: allow letters, numbers, dashes, slashes; prevent traversal
      const safe = dirParam
        .replace(/[^a-zA-Z0-9_\-/]/g, "")
        .replace(/\.\.+/g, "");
      const candidate = path.join(process.cwd(), "public", safe);
      // Ensure candidate stays under public/
      const publicRoot = path.join(process.cwd(), "public");
      if (candidate.startsWith(publicRoot) && fs.existsSync(candidate)) {
        dir = candidate;
      }
    }
    if (!fs.existsSync(dir)) {
      // fallback to public/imagens
      dir = path.join(process.cwd(), "public", "imagens");
      if (!fs.existsSync(dir)) {
        return NextResponse.json({ images: [] });
      }
    }
    const files = fs.readdirSync(dir);
    const images = files
      .filter((f) => ALLOWED_EXT.has(path.extname(f).toLowerCase()))
      .sort()
      // Serve via API to support non-public folder
      .map((f) => `/api/images/file?name=${encodeURIComponent(f)}`);
    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}













