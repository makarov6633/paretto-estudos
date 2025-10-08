import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";
import { item } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (!slug) return new NextResponse("Bad Request", { status: 400 });
  try {
    const rows = await db
      .select()
      .from(item)
      .where(eq(item.slug, slug))
      .limit(1);
    const pdfUrl = rows[0]?.pdfUrl;
    if (!pdfUrl) return new NextResponse("Not Found", { status: 404 });
    // Sanitize and confine to public directory
    const rel = pdfUrl.replace(/^\/+/, "").replace(/\.\.+/g, "");
    const publicRoot = path.join(process.cwd(), "public");
    const abs = path.resolve(path.join(publicRoot, rel));
    if (!abs.startsWith(path.resolve(publicRoot))) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    if (!fs.existsSync(abs))
      return new NextResponse("Not Found", { status: 404 });
    const data = fs.readFileSync(abs);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="document.pdf"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "same-origin",
        // Hide default viewer controls in many browsers via fragment in embed; headers add minimal hardening
        "Content-Security-Policy":
          "default-src 'none'; img-src 'self' data: blob:; media-src 'self' blob: data:; style-src 'unsafe-inline'; frame-ancestors 'self'",
      },
    });
  } catch {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
