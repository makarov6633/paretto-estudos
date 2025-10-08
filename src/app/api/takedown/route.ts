import { NextResponse } from "next/server";
import { 
  validateBodySize, 
  validateContentType, 
  safeJsonParse 
} from "@/lib/http";
import { PAYLOAD_LIMITS, FIELD_LIMITS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    // Validações de request
    const sizeError = validateBodySize(req, PAYLOAD_LIMITS.TAKEDOWN);
    if (sizeError) return sizeError;
    
    const typeError = validateContentType(req, "application/json");
    if (typeError) return typeError;
    
    // Parse seguro do body
    const body = await safeJsonParse(req);
    const name = (body?.name ?? "").toString().trim().slice(0, FIELD_LIMITS.NAME);
    const email = (body?.email ?? "").toString().trim().slice(0, FIELD_LIMITS.EMAIL);
    const url = (body?.url ?? "").toString().trim().slice(0, FIELD_LIMITS.URL);
    const details = (body?.details ?? "").toString().trim().slice(0, FIELD_LIMITS.DETAILS);
    const confirm = Boolean(body?.confirm);

    if (!name || !email || !url || !details || !confirm) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 400 },
      );
    }

    const record = {
      id: crypto.randomUUID(),
      ts: new Date().toISOString(),
      name,
      email,
      url,
      details,
      ua: req.headers.get("user-agent") || "",
      ip: req.headers.get("x-forwarded-for") || "",
    };

    try {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const file = path.join(process.cwd(), "takedown-requests.log.jsonl");
      fs.appendFileSync(file, JSON.stringify(record) + "\n", "utf-8");
    } catch {}

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
