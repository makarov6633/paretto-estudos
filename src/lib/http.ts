import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function getJSON<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

// Stable stringify to ensure ETag consistency regardless of key order
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const parts: string[] = [];
  for (const k of keys) {
    parts.push(`${JSON.stringify(k)}:${stableStringify(obj[k])}`);
  }
  return `{${parts.join(",")}}`;
}

export function computeEtag(data: unknown, weak = true): string {
  const input = stableStringify(data);
  const hash = crypto.createHash("sha1").update(input).digest("base64url");
  return weak ? `W/"${hash}"` : `"${hash}"`;
}

/**
 * Retorna resposta com ETag e suporte a cache condicional (304 Not Modified).
 * 
 * @param req - Request original para verificar If-None-Match
 * @param data - Dados a serem retornados
 * @param cacheControl - Diretiva de Cache-Control (ex: "public, s-maxage=180")
 * @returns Response com status 304 (se cache válido) ou 200 com dados
 * 
 * @example
 * ```typescript
 * const items = await db.select().from(item);
 * return withETag(req, { items }, "public, s-maxage=180, stale-while-revalidate=60");
 * ```
 */
export function withETag(
  req: Request,
  data: unknown,
  cacheControl: string
): Response {
  const etag = computeEtag(data);
  const inm = req.headers.get("if-none-match");
  
  if (inm && inm === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": cacheControl,
      },
    });
  }
  
  return NextResponse.json(data, {
    headers: {
      ETag: etag,
      "Cache-Control": cacheControl,
    },
  });
}

/**
 * Valida tamanho do body da requisição.
 * 
 * @param req - Request a ser validada
 * @param maxBytes - Tamanho máximo permitido em bytes
 * @returns null se válido, Response de erro se exceder
 * 
 * @example
 * ```typescript
 * const sizeError = validateBodySize(req, 64 * 1024); // 64KB
 * if (sizeError) return sizeError;
 * ```
 */
export function validateBodySize(
  req: Request,
  maxBytes: number
): Response | null {
  const len = Number(req.headers.get("content-length") || 0);
  if (len && len > maxBytes) {
    return NextResponse.json(
      { error: "payload_too_large" },
      { status: 413 }
    );
  }
  return null;
}

/**
 * Valida Content-Type da requisição.
 * 
 * @param req - Request a ser validada
 * @param expectedType - Tipo esperado (ex: "application/json")
 * @returns null se válido, Response de erro se inválido
 * 
 * @example
 * ```typescript
 * const typeError = validateContentType(req, "application/json");
 * if (typeError) return typeError;
 * ```
 */
export function validateContentType(
  req: Request,
  expectedType: string
): Response | null {
  const ct = (req.headers.get("content-type") || "").toLowerCase();
  if (!ct.includes(expectedType)) {
    return NextResponse.json(
      { error: "unsupported_content_type" },
      { status: 415 }
    );
  }
  return null;
}

/**
 * Parse seguro de JSON da requisição.
 * 
 * @param req - Request a ser parseada
 * @returns Objeto parseado ou objeto vazio se falhar
 * 
 * @example
 * ```typescript
 * const body = await safeJsonParse(req);
 * const validated = schema.safeParse(body);
 * ```
 */
export async function safeJsonParse(req: Request): Promise<Record<string, unknown>> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
