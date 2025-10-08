import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/constants";

// Simple in-memory rate limiter (best effort per instance)
const WINDOW_MS = 60_000; // 1 minute

const hits = new Map<string, { count: number; reset: number }>();

function allow(key: string, limit: number) {
  const now = Date.now();
  const curr = hits.get(key);
  if (!curr || curr.reset < now) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS });
    return { ok: true, remaining: limit - 1, reset: now + WINDOW_MS };
  }
  if (curr.count >= limit)
    return { ok: false, remaining: 0, reset: curr.reset };
  curr.count += 1;
  return { ok: true, remaining: limit - curr.count, reset: curr.reset };
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip static assets & Next internals
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // Bypass secret for internal testing/ops
  const bypass = req.headers.get("x-rate-limit-bypass");
  if (bypass && bypass === (process.env.RATE_LIMIT_BYPASS_SECRET || "")) {
    return NextResponse.next();
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";

  const group = path.startsWith("/api/admin")
    ? "admin"
    : path.startsWith("/api/chat")
      ? "chat"
      : path.startsWith("/api/takedown")
        ? "takedown"
        : path.startsWith("/api/")
          ? "api"
          : "page";

  const key = `${ip}:${group}`;
  const limit =
    group === "admin"
      ? RATE_LIMITS.ADMIN
      : group === "chat"
        ? RATE_LIMITS.CHAT
        : group === "takedown"
          ? RATE_LIMITS.TAKEDOWN
          : group === "api"
            ? RATE_LIMITS.API
            : RATE_LIMITS.PAGE;

  const { ok, remaining, reset } = allow(key, limit);
  if (!ok) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
