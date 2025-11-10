import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { RATE_LIMITS } from "@/lib/constants";

// Simple in-memory rate limiter (best effort per instance)
const WINDOW_MS = 60_000; // 1 minute

const hits = new Map<string, { count: number; reset: number }>();

// Limpeza periódica para evitar memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hits.entries()) {
      if (value.reset < now) {
        hits.delete(key);
      }
    }
  }, 60000);
}

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

/**
 * Get client IP with priority order
 */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ||       // Cloudflare
    req.headers.get('x-real-ip') ||              // Nginx
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || // Proxy
    'unknown'
  );
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response: NextResponse, isProd: boolean): NextResponse {
  // 1. Content Security Policy (CSP) - Previne XSS
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.openai.com https://*.stripe.com https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  
  if (isProd) {
    csp.push('upgrade-insecure-requests');
  }
  
  response.headers.set('Content-Security-Policy', csp.join('; '));
  
  // 2. HTTP Strict Transport Security (HSTS)
  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );
  }
  
  // 3. X-Frame-Options - Previne clickjacking
  response.headers.set('X-Frame-Options', 'DENY');
  
  // 4. X-Content-Type-Options - Previne MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // 5. Referrer-Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 6. Permissions-Policy
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  // 7. X-XSS-Protection (legacy, mas ainda útil)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // 8. X-DNS-Prefetch-Control
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // 9. Remover headers que expõem informações
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  
  return response;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProd = process.env.NODE_ENV === 'production';

  // Skip static assets & Next internals
  if (
    path.startsWith("/_next") ||
    path.startsWith("/favicon") ||
    /\.(?:css|js|png|jpg|jpeg|webp|svg|ico|woff2|woff|ttf|eot)$/.test(path)
  ) {
    return NextResponse.next();
  }

  // Bypass secret for internal testing/ops
  const bypass = req.headers.get("x-rate-limit-bypass");
  if (bypass && bypass === (process.env.RATE_LIMIT_BYPASS_SECRET || "")) {
    const response = NextResponse.next();
    return addSecurityHeaders(response, isProd);
  }

  const ip = getClientIP(req);

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
            : path.startsWith("/api/media")
              ? "media"
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
            ? 10
            : group === "telemetry"
              ? 20
              : group === "media"
                ? 30 // 30 downloads de mídia por minuto
                : group === "api"
                  ? RATE_LIMITS.API
                  : RATE_LIMITS.PAGE;

  const { ok, remaining, reset } = allow(key, limit);
  
  if (!ok) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000);
    const errorResponse = new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(reset / 1000)),
        },
      }
    );
    return addSecurityHeaders(errorResponse, isProd);
  }
  
  const response = NextResponse.next();
  
  // Adicionar rate limit headers
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.floor(reset / 1000)));
  
  return addSecurityHeaders(response, isProd);
}

export const config = { 
  matcher: [
    /*
     * Match todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
