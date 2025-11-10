/**
 * Input Sanitization and Validation
 * Protege contra XSS, injection attacks e prompt injection (se usar LLM)
 */

// ========== XSS PROTECTION ==========

/**
 * Sanitiza string para prevenir XSS
 * Remove/escapa caracteres perigosos
 */
export function sanitizeString(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;") // Forward slash
    .trim();
}

/**
 * Sanitiza HTML removendo tags perigosas
 * Mantém apenas formatação básica segura
 */
export function sanitizeHtml(html: string): string {
  // Remove scripts
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs (podem conter scripts)
  sanitized = sanitized.replace(/data:text\/html/gi, '');
  
  return sanitized;
}

// ========== INPUT VALIDATION ==========

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valida UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Valida slug (URLs amigáveis)
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 200;
}

/**
 * Valida número inteiro positivo
 */
export function isPositiveInteger(value: unknown): boolean {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Valida range de números
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// ========== PROMPT INJECTION DETECTION ==========

/**
 * Padrões perigosos de prompt injection
 * Use apenas se estiver usando LLM
 */
const DANGEROUS_PATTERNS = [
  // Comandos de override
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/gi,
  /forget\s+(everything|all|previous)/gi,
  /you\s+are\s+now/gi,
  /new\s+(instructions?|rules?|role)/gi,
  
  // Delimitadores de sistema
  /(system|assistant|user)\s*:\s*/gi,
  /<\|im_(start|end)\|>/gi,
  /<\|endoftext\|>/gi,
  /\[INST\]|\[\/INST\]/gi,
  
  // SQL Injection básico
  /(\bOR\b|\bAND\b)\s+['"]?\d+['"]?\s*=\s*['"]?\d+/gi,
  /UNION\s+SELECT/gi,
  /DROP\s+(TABLE|DATABASE)/gi,
  /;.*?(DROP|DELETE|UPDATE|INSERT)/gi,
];

/**
 * Detecta tentativas de prompt injection ou SQL injection
 */
export function containsSuspiciousPatterns(input: string): boolean {
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

/**
 * Sanitiza input para uso com LLM (se aplicável)
 */
export function sanitizeForLLM(input: string): string {
  // Remover caracteres de controle
  let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
  
  // Normalizar quebras de linha
  sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // Limitar quebras de linha consecutivas
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  // Normalizar espaços
  sanitized = sanitized
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .trim();
  
  return sanitized;
}

// ========== VALIDAÇÃO DE MENSAGENS DE CHAT ==========

export interface ChatMessageValidation {
  isValid: boolean;
  error?: string;
  sanitized?: string;
}

/**
 * Valida e sanitiza mensagem de chat
 */
export function validateChatMessage(content: unknown): ChatMessageValidation {
  // Tipo
  if (typeof content !== 'string') {
    return { isValid: false, error: 'Message must be a string' };
  }
  
  // Tamanho
  if (content.length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 10000) {
    return { isValid: false, error: 'Message too long (max 10000 characters)' };
  }
  
  // Detectar padrões suspeitos
  if (containsSuspiciousPatterns(content)) {
    return { isValid: false, error: 'Message contains suspicious patterns' };
  }
  
  // Detectar HTML/Scripts
  if (/<script/gi.test(content) || /javascript:/gi.test(content)) {
    return { isValid: false, error: 'Message contains dangerous HTML' };
  }
  
  // Sanitizar
  const sanitized = sanitizeForLLM(content);
  
  return { isValid: true, sanitized };
}

// ========== PATH TRAVERSAL PROTECTION ==========

/**
 * Previne ataques de path traversal
 * Remove ../ e caracteres perigosos
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove ../
    .replace(/[/\\]/g, '') // Remove / e \
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Apenas chars seguros
    .substring(0, 255); // Limitar tamanho
}

/**
 * Valida extensão de arquivo
 */
export function isAllowedFileExtension(filename: string, allowed: string[]): boolean {
  const ext = filename.toLowerCase().split('.').pop();
  return ext ? allowed.includes(ext) : false;
}

// ========== VALIDAÇÃO DE PARÂMETROS DE URL ==========

/**
 * Valida parâmetro de pesquisa
 */
export function validateSearchQuery(query: unknown): { isValid: boolean; error?: string; value?: string } {
  if (typeof query !== 'string') {
    return { isValid: false, error: 'Query must be a string' };
  }
  
  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Query cannot be empty' };
  }
  
  if (trimmed.length > 200) {
    return { isValid: false, error: 'Query too long' };
  }
  
  // Prevenir XSS em queries
  if (/<script/gi.test(trimmed)) {
    return { isValid: false, error: 'Query contains dangerous content' };
  }
  
  return { isValid: true, value: sanitizeString(trimmed) };
}

/**
 * Valida limite de paginação
 */
export function validateLimit(limit: unknown, max: number = 100): { isValid: boolean; value: number } {
  const num = Number(limit);
  
  if (!Number.isInteger(num) || num < 1) {
    return { isValid: true, value: 24 }; // Default
  }
  
  return { isValid: true, value: Math.min(num, max) };
}

/**
 * Valida offset de paginação
 */
export function validateOffset(offset: unknown): { isValid: boolean; value: number } {
  const num = Number(offset);
  
  if (!Number.isInteger(num) || num < 0) {
    return { isValid: true, value: 0 }; // Default
  }
  
  return { isValid: true, value: num };
}

// ========== RATE LIMITING PER USER ==========

/**
 * Verifica se usuário excedeu limite de requisições
 * (Simplificado - usar Redis em produção)
 */
const userRequestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkUserRateLimit(userId: string, limit: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = userRequestCounts.get(userId);
  
  if (!userLimit || userLimit.resetAt < now) {
    userRequestCounts.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= limit) {
    return false;
  }
  
  userLimit.count += 1;
  return true;
}

// Limpeza periódica
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [userId, data] of userRequestCounts.entries()) {
      if (data.resetAt < now) {
        userRequestCounts.delete(userId);
      }
    }
  }, 60000);
}
