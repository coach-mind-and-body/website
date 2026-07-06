const DANGEROUS_TAGS = /<(script|iframe|object|embed|form|input|button|textarea|select|link|meta|base|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_DANGEROUS = /<(script|iframe|object|embed|form|input|button|textarea|select|link|meta|base|style)\b[^>]*\/?>/gi;
const ON_EVENT_ATTR = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL_ATTR = /\s+(href|src|xlink:href)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;
const DATA_ATTR = /\s+data:\s*(?:"[^"]*"|'[^']*')/gi;

/**
 * Basic HTML sanitizer — strips dangerous tags, event handlers, and javascript: URLs.
 * Used server-side on blog create/update and client-side before rendering.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  let result = html;
  result = result.replace(DANGEROUS_TAGS, "");
  result = result.replace(SELF_CLOSING_DANGEROUS, "");
  result = result.replace(ON_EVENT_ATTR, "");
  result = result.replace(JS_URL_ATTR, "");
  result = result.replace(DATA_ATTR, "");

  return result;
}