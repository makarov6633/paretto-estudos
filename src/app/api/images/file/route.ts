import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return new NextResponse("Bad Request", { status: 400 });

  // Prevent path traversal by forcing basename and validating extension
  const safeName = path.basename(name).replace(/[^a-zA-Z0-9_.\-]/g, "");
  const ext = path.extname(safeName).toLowerCase();
  const allowed = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg"]);
  if (!allowed.has(ext))
    return new NextResponse("Unsupported Media Type", { status: 415 });

  const roots = [
    path.join(process.cwd(), "imagens"),
    path.join(process.cwd(), "public", "imagens"),
  ];

  for (const root of roots) {
    const candidate = path.join(root, safeName);
    // Ensure the resolved path stays within the intended root
    const resolved = path.resolve(candidate);
    if (!resolved.startsWith(path.resolve(root))) continue;
    if (fs.existsSync(resolved)) {
      const data = fs.readFileSync(resolved);
      const type =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : ext === ".svg"
                ? "image/svg+xml"
                : "application/octet-stream";
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  return new NextResponse("Not Found", { status: 404 });
}
