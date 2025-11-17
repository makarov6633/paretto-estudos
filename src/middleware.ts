import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/constants";
import { checkUserAccess } from "@/lib/access-control";
import { logger } from "@/lib/logger";

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

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');

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
        : path.startsWith("/api/access/check")
          ? "access"
          : path.startsWith("/api/telemetry")
            ? "telemetry"
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
          : group === "access"
            ? 10 // 10 access checks per minute
            : group === "telemetry"
              ? 20 // 20 telemetry events per minute
              : group === "api"
                ? RATE_LIMITS.API
                : RATE_LIMITS.PAGE;

  const { ok, remaining, reset } = allow(key, limit);
  if (!ok) {
    logger.warn(
      { ip, path, group, limit },
      'Rate limit exceeded'
    );
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  }
  
  // CSRF Protection: validate origin/referer for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const isValidOrigin = origin && origin.startsWith(appUrl);
    const isValidReferer = referer && referer.startsWith(appUrl);
    
    // Allow if no origin/referer (same-origin request) or if valid
    if (origin && !isValidOrigin && !isValidReferer) {
      logger.warn(
        { ip, path, origin, referer, method: req.method },
        'CSRF check failed: invalid origin/referer'
      );
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  
  // Premium route protection
  const premiumPaths = ['/dashboard', '/profile', '/leaderboard'];
  const isPremiumPath = premiumPaths.some(p => path.startsWith(p));
  
  if (isPremiumPath) {
    try {
      // Extract userId from session cookie
      const cookie = req.headers.get('cookie') || '';
      const sessionMatch = cookie.match(/paretto[._]session[._]token=([^;]+)/);
      
      if (!sessionMatch) {
        logger.info({ path, ip }, 'Unauthenticated access to premium route');
        return NextResponse.redirect(new URL('/library', req.url));
      }
      
      // Get session from auth API
      const sessionRes = await fetch(`${req.nextUrl.origin}/api/auth/get-session`, {
        headers: { cookie: req.headers.get('cookie') || '' },
        cache: 'no-store',
      });
      
      if (!sessionRes.ok) {
        return NextResponse.redirect(new URL('/library', req.url));
      }
      
      const session = await sessionRes.json();
      const userId = session?.user?.id;
      
      if (!userId) {
        return NextResponse.redirect(new URL('/library', req.url));
      }
      
      // Check subscription access
      const access = await checkUserAccess(userId);
      
      if (!access.allowed && access.reason === 'limit') {
        logger.info(
          { userId, path, reason: access.reason },
          'Free tier limit reached on premium route'
        );
        return NextResponse.redirect(new URL('/plans', req.url));
      }
    } catch (err) {
      logger.error({ err, path }, 'Error checking premium route access');
      // Fail open for now (don't block legitimate users on errors)
    }
  }
  
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
