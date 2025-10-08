import { NextResponse } from "next/server";
import { getCsrfToken } from "@/lib/security";

export async function GET() {
  const token = getCsrfToken();
  const res = NextResponse.json({ ok: true });
  res.headers.set(
    "Set-Cookie",
    `csrf_token=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Secure=${process.env.NODE_ENV === "production" ? "true" : "false"}`,
  );
  return res;
}
