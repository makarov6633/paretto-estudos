import crypto from "node:crypto";

export function sanitizeString(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const N = 16384,
    r = 8,
    p = 1,
    keyLen = 64; // scrypt params
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N, r, p }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(
        `scrypt$N=${N},r=${r},p=${p}$${salt.toString("base64")}$${derivedKey.toString("base64")}`,
      );
    });
  });
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    const [scheme, params, saltB64, hashB64] = stored.split("$");
    if (!scheme || !params || !saltB64 || !hashB64) return false;
    const salt = Buffer.from(saltB64, "base64");
    const m = /N=(\d+),r=(\d+),p=(\d+)/.exec(params);
    const N = m ? Number(m[1]) : 16384;
    const r = m ? Number(m[2]) : 8;
    const p = m ? Number(m[3]) : 1;
    return await new Promise((resolve) => {
      crypto.scrypt(
        password,
        salt,
        Buffer.from(hashB64, "base64").length,
        { N, r, p },
        (err, key) => {
          if (err) return resolve(false);
          resolve(crypto.timingSafeEqual(key, Buffer.from(hashB64, "base64")));
        },
      );
    });
  } catch {
    return false;
  }
}

const JWT_ALG = "HS256";

function base64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Obtém o JWT secret validado.
 * SEMPRE exige que a variável esteja configurada (sem fallback).
 * 
 * @throws Error se JWT_SECRET não estiver definido
 */
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  
  // Validar tamanho mínimo (256 bits = 32 bytes = 44 chars base64)
  if (secret.length < 44) {
    throw new Error(
      "JWT_SECRET must be at least 32 bytes (44 base64 characters). " +
      "Current length: " + secret.length
    );
  }
  
  return secret;
}

/**
 * Assina um JWT com payload e expiração.
 * 
 * @param payload - Dados a serem incluídos no token
 * @param expiresInSec - Tempo de expiração em segundos (padrão: 1 hora)
 * @returns Token JWT assinado
 * 
 * @example
 * ```typescript
 * const token = signJwt({ userId: "123" }, 3600);
 * ```
 */
export function signJwt(
  payload: Record<string, unknown>,
  expiresInSec = 60 * 60,
): string {
  const header = { alg: JWT_ALG, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { iat: now, exp: now + expiresInSec, ...payload } as Record<
    string,
    unknown
  >;
  const encHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encPayload = base64url(Buffer.from(JSON.stringify(body)));
  const data = `${encHeader}.${encPayload}`;
  const secret = getJwtSecret();
  const sig = crypto.createHmac("sha256", secret).update(data).digest();
  return `${data}.${base64url(sig)}`;
}

/**
 * Verifica e decodifica um JWT.
 * 
 * @param token - Token JWT a ser verificado
 * @returns Payload do token se válido, null se inválido ou expirado
 * 
 * @example
 * ```typescript
 * const payload = verifyJwt(token);
 * if (payload) {
 *   console.log("User ID:", payload.userId);
 * }
 * ```
 */
export function verifyJwt(token: string): Record<string, unknown> | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const secret = getJwtSecret();
    const data = `${h}.${p}`;
    const expected = base64url(
      crypto.createHmac("sha256", secret).update(data).digest(),
    );
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s)))
      return null;
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
        "utf8",
      ),
    );
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now > Number(payload.exp)) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getCsrfToken(): string {
  return base64url(crypto.randomBytes(24));
}

export function verifyCsrf(req: Request): boolean {
  try {
    const cookie = req.headers.get("cookie") || "";
    const hdr = req.headers.get("x-csrf-token") || "";
    const match = /csrf_token=([^;]+)/.exec(cookie);
    if (!match) return false;
    const val = decodeURIComponent(match[1]);
    return crypto.timingSafeEqual(Buffer.from(val), Buffer.from(hdr));
  } catch {
    return false;
  }
}
