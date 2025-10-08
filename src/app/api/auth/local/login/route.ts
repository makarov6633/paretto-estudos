import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { account } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { verifyPassword, signJwt, verifyCsrf } from "@/lib/security";

const schema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  if (!verifyCsrf(req))
    return NextResponse.json({ error: "csrf" }, { status: 403 });
  const json = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(json);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const { email, password } = parsed.data;
  const emailLc = email.toLowerCase();
  try {
    const rows = await db
      .select()
      .from(account)
      .where(
        and(eq(account.providerId, "local"), eq(account.accountId, emailLc)),
      )
      .limit(1);
    const acc = rows[0];
    if (!acc?.password)
      return NextResponse.json({ error: "invalid" }, { status: 401 });
    const ok = await verifyPassword(password, acc.password);
    if (!ok) return NextResponse.json({ error: "invalid" }, { status: 401 });
    const jwt = signJwt({ uid: acc.userId, email: emailLc });
    const res = NextResponse.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `auth_token=${jwt}; Path=/; HttpOnly; SameSite=Lax; Secure=${process.env.NODE_ENV === "production" ? "true" : "false"}`,
    );
    return res;
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
