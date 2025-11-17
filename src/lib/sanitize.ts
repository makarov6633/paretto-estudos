import DOMPurify from "isomorphic-dompurify";

/**
 * Configuração padrão segura para DOMPurify
 * 
 * Baseada nas recomendações de segurança:
 * - Bloqueia scripts inline e handlers de eventos
 * - Permite apenas URLs HTTPS
 * - Remove tags perigosas (script, iframe, style, form)
 * - Remove atributos de evento (onclick, onerror, etc)
 */
const DEFAULT_CONFIG: DOMPurify.Config & Record<string, unknown> = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 
    'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'a', 'span', 'div',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'code', 'pre'
  ],
  ALLOWED_ATTR: [
    'href', 'class', 'id', 'title', 
    'target', 'rel'
  ],
  ALLOWED_URI_REGEXP: /^https?:\/\//i,
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'style'],
};

/**
 * Sanitiza HTML com configuração padrão segura
 * 
 * @param dirty - HTML não sanitizado
 * @param config - Configuração customizada (opcional)
 * @returns HTML sanitizado
 * 
 * @example
 * ```typescript
 * const clean = sanitizeHtml('<p>Safe content</p><script>alert("xss")</script>');
 * // Retorna: '<p>Safe content</p>'
 * ```
 */
export function sanitizeHtml(
  dirty: string, 
  config?: DOMPurify.Config & Record<string, unknown>
): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, { 
    ...DEFAULT_CONFIG, 
    ...config 
  });
}

/**
 * Sanitização mais restritiva para imports administrativos
 * 
 * Remove atributo 'style' e 'target' para evitar injeção de CSS
 * e controle de navegação não autorizado.
 * 
 * @param dirty - HTML não sanitizado do admin
 * @returns HTML sanitizado com regras mais estritas
 * 
 * @example
 * ```typescript
 * const clean = sanitizeAdminHtml('<a href="https://evil.com" onclick="hack()">Link</a>');
 * // Retorna: '<a href="https://evil.com">Link</a>'
 * ```
 */
export function sanitizeAdminHtml(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ...DEFAULT_CONFIG,
    ALLOWED_ATTR: ['href', 'class', 'id', 'title'], // Sem style, target
    FORBID_TAGS: [
      'style', 'script', 'iframe', 'form', 
      'input', 'button', 'object', 'embed'
    ],
  });
}

/**
 * Sanitização para conteúdo de leitura (reader)
 * 
 * Permite mais tags e atributos para formatação rica,
 * mas ainda bloqueia execução de scripts e handlers.
 * 
 * @param dirty - HTML do conteúdo de leitura
 * @returns HTML sanitizado com formatação preservada
 */
export function sanitizeReaderHtml(dirty: string): string {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ...DEFAULT_CONFIG,
    ALLOWED_TAGS: [
      ...DEFAULT_CONFIG.ALLOWED_TAGS as string[],
      'sup', 'sub', 'mark', 'del', 'ins', 'cite'
    ],
    ALLOWED_ATTR: [
      ...DEFAULT_CONFIG.ALLOWED_ATTR as string[],
    ],
    KEEP_CONTENT: true,
  });
}
