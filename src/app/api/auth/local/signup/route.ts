import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { account, user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import {
  hashPassword,
  signJwt,
  verifyCsrf,
  sanitizeString,
} from "@/lib/security";

const schema = z.object({
  name: z.string().min(2).max(120),
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
  const { name, email, password } = parsed.data;
  const emailLc = email.toLowerCase();
  try {
    const existing = await db
      .select()
      .from(account)
      .where(eq(account.accountId, emailLc))
      .limit(1);
    if (existing.length)
      return NextResponse.json({ error: "exists" }, { status: 409 });
    const uid = crypto.randomUUID();
    await db
      .insert(user)
      .values({ id: uid, name: sanitizeString(name), email: emailLc });
    const hashed = await hashPassword(password);
    await db.insert(account).values({
      id: crypto.randomUUID(),
      userId: uid,
      providerId: "local",
      accountId: emailLc,
      password: hashed,
    });
    const jwt = signJwt({ uid, email: emailLc });
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
