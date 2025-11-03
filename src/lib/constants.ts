/**
 * Constantes centralizadas do projeto.
 * 
 * Este arquivo centraliza valores que anteriormente estavam hardcoded,
 * melhorando a manutenibilidade e evitando magic numbers.
 */

/**
 * Limites de tamanho de payloads (em bytes)
 */
export const PAYLOAD_LIMITS = {
  /** Tamanho máximo para requests de book (64KB) */
  BOOK_REQUEST: 64 * 1024,
  
  /** Tamanho máximo para takedown requests (256KB) */
  TAKEDOWN: 256 * 1024,
  
  /** Tamanho máximo para telemetria (32KB) */
  TELEMETRY: 32 * 1024,
  
  /** Tamanho máximo para chat messages (128KB) */
  CHAT: 128 * 1024,
} as const;

/**
 * Limites de tamanho de campos de texto
 */
export const FIELD_LIMITS = {
  /** Nome de pessoa */
  NAME: 120,
  
  /** Email */
  EMAIL: 160,
  
  /** Título de livro */
  TITLE: 200,
  
  /** Autor */
  AUTHOR: 200,
  
  /** URL */
  URL: 1000,
  
  /** Notas/comentários */
  NOTES: 1000,
  
  /** Detalhes longos (ex: takedown) */
  DETAILS: 4000,
} as const;

/**
 * Rate limits por endpoint (requests por minuto)
 */
export const RATE_LIMITS = {
  /** Endpoints de admin */
  ADMIN: 20,
  
  /** Chat com IA */
  CHAT: 60,
  
  /** Takedown requests */
  TAKEDOWN: 10,
  
  /** APIs gerais */
  API: 120,
  
  /** Páginas públicas */
  PAGE: 90,
} as const;

/**
 * Configurações de cache
 */
export const CACHE_CONTROL = {
  /** Cache padrão para conteúdo público */
  PUBLIC_SHORT: "public, s-maxage=60, stale-while-revalidate=30",
  
  /** Cache para items/biblioteca */
  PUBLIC_MEDIUM: "public, s-maxage=180, stale-while-revalidate=60",
  
  /** Cache para assets estáticos */
  PUBLIC_LONG: "public, s-maxage=3600, stale-while-revalidate=300",
  
  /** Sem cache */
  NO_CACHE: "no-store, no-cache, must-revalidate",
} as const;

/**
 * Limites de paginação
 */
export const PAGINATION = {
  /** Limite padrão de itens por página */
  DEFAULT_LIMIT: 24,
  
  /** Limite mínimo */
  MIN_LIMIT: 1,
  
  /** Limite máximo */
  MAX_LIMIT: 100,
  
  /** Página inicial padrão */
  DEFAULT_PAGE: 1,
} as const;

/**
 * Timeouts (em milissegundos)
 */
export const TIMEOUTS = {
  /** Timeout para requests externos */
  EXTERNAL_REQUEST: 30_000, // 30s
  
  /** Timeout para operações de IA */
  AI_OPERATION: 120_000, // 2min
  
  /** Timeout para webhook processing */
  WEBHOOK: 10_000, // 10s
} as const;

/**
 * Configurações de segurança
 */
export const SECURITY = {
  /** Parâmetros scrypt para hash de senha */
  SCRYPT_PARAMS: {
    N: 16384,
    r: 8,
    p: 1,
    keyLen: 64,
    saltLen: 16,
  },
  
  /** Tamanho do CSRF token em bytes */
  CSRF_TOKEN_SIZE: 24,
  
  /** Tamanho do JWT secret mínimo */
  MIN_JWT_SECRET_LENGTH: 32,
} as const;

/**
 * Mensagens de erro padronizadas
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "unauthorized",
  FORBIDDEN: "forbidden",
  NOT_FOUND: "not_found",
  INVALID_INPUT: "invalid_input",
  PAYLOAD_TOO_LARGE: "payload_too_large",
  UNSUPPORTED_CONTENT_TYPE: "unsupported_content_type",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  SERVER_ERROR: "server_error",
  CSRF_INVALID: "csrf_invalid",
  ALREADY_EXISTS: "already_exists",
} as const;

/**
 * Status de subscription Stripe
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  TRIALING: "trialing",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  UNPAID: "unpaid",
} as const;

/**
 * Status de book request
 */
export const REQUEST_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;

/**
 * Tipos de eventos de telemetria
 */
export const TELEMETRY_EVENTS = {
  PAGE_VIEW: "page_view",
  ITEM_OPEN: "item_open",
  PDF_DOWNLOAD: "pdf_download",
  SEARCH: "search",
  SIGNUP: "signup",
  LOGIN: "login",
  SUBSCRIPTION_START: "subscription_start",
} as const;


