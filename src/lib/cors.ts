/**
 * CORS utilities for secure cross-origin requests
 * 
 * Implements security best practices:
 * - Explicit origin allowlist (no wildcards with credentials)
 * - Vary: Origin header for caching
 * - Secure defaults
 * 
 * Usage:
 * ```typescript
 * import { getCorsHeaders, handleCorsPreflightRequest } from '@/lib/cors';
 * 
 * // In API route
 * export async function OPTIONS(req: Request) {
 *   return handleCorsPreflightRequest(req);
 * }
 * 
 * export async function GET(req: Request) {
 *   const data = { ... };
 *   return new Response(JSON.stringify(data), {
 *     headers: getCorsHeaders(req),
 *   });
 * }
 * ```
 */

/**
 * Allowed origins for CORS requests
 * Add your production/staging domains here
 */
const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  // Add production domains when available
  // 'https://paretto.com.br',
  // 'https://www.paretto.com.br',
].filter(Boolean) as string[]);

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
}

/**
 * Get CORS headers for a request
 * 
 * @param req - Request object
 * @param options - CORS options
 * @returns Headers object with CORS headers
 */
export function getCorsHeaders(
  req: Request,
  options: {
    allowCredentials?: boolean;
    allowedMethods?: string[];
    allowedHeaders?: string[];
    maxAge?: number;
  } = {}
): HeadersInit {
  const origin = req.headers.get('origin');
  
  const {
    allowCredentials = true,
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge = 86400, // 24 hours
  } = options;
  
  // Default: allow the app itself
  const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Use origin if allowed, otherwise default
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : defaultOrigin;
  
  const headers: HeadersInit = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin', // Important for caching
    'Access-Control-Allow-Methods': allowedMethods.join(', '),
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Max-Age': String(maxAge),
  };
  
  // Only send credentials header if needed
  if (allowCredentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

/**
 * Handle CORS preflight (OPTIONS) request
 * 
 * @param req - Request object
 * @returns Response with CORS headers
 */
export function handleCorsPreflightRequest(req: Request): Response {
  const origin = req.headers.get('origin');
  
  // Log suspicious preflight requests
  if (origin && !isOriginAllowed(origin)) {
    console.warn('CORS preflight from disallowed origin:', origin);
  }
  
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

/**
 * Middleware helper to add CORS headers to response
 * 
 * @param req - Request object
 * @param res - Response object
 * @returns Response with CORS headers added
 */
export function withCors(req: Request, res: Response): Response {
  const corsHeaders = getCorsHeaders(req);
  const headers = new Headers(res.headers);
  
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
