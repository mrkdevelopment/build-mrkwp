// Reading facts out of a fetched page with pattern matching. No page is ever run, and everything
// taken from one is treated as text written by a stranger.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', lsaquo: '<', rsaquo: '>', laquo: '<', raquo: '>', hellip: '...', copy: '(c)', reg: '', trade: '', middot: '|', bull: '|' };

export function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d{1,7});/g, (_, n) => safeChar(Number(n)))
    .replace(/&#x([0-9a-f]{1,6});/gi, (_, n) => safeChar(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole);
}

const safeChar = (code: number): string => (code > 31 && code < 0x110000 ? String.fromCodePoint(code) : ' ');

/** A value from a page, made safe to keep: one line, no control characters, not too long. */
export function clean(value: unknown, max = 200): string {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  return decodeEntities(String(value))
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

/** The value of one attribute inside a tag's text. */
export function attr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i'));
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3] ?? '').trim() : '';
}

/** Every opening tag of one kind, e.g. all `<meta ...>`. */
export function tags(html: string, name: string, limit = 3000): string[] {
  return (html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) ?? []).slice(0, limit);
}

export interface Link {
  url: URL;
  text: string;
}

/** Every link on the page that leads to a web address. */
export function links(html: string, base: string, limit = 3000): Link[] {
  const found: Link[] = [];
  const pattern = /<a\b([^>]*)>([\s\S]{0,2000}?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while (found.length < limit && (match = pattern.exec(html))) {
    const href = attr(`<a ${match[1]}>`, 'href');
    if (!href || href.startsWith('#') || /^(mailto|tel|javascript|sms|data):/i.test(href)) continue;
    try {
      const url = new URL(href, base);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        const label = clean(match[2], 80) || clean(attr(`<a ${match[1]}>`, 'aria-label'), 80) || clean(attr(`<a ${match[1]}>`, 'title'), 80);
        found.push({ url, text: label });
      }
    } catch {
      // not an address
    }
  }
  return found;
}

/** Phone numbers from `tel:` links. */
export function telLinks(html: string): string[] {
  return [...html.matchAll(/href\s*=\s*["']tel:([^"']{6,30})["']/gi)].map((m) => clean(decodeURIComponent(m[1].replace(/%(?![0-9a-f]{2})/gi, '')), 30)).filter(Boolean);
}

/** `<meta name|property="...">` values, keyed in lower case. */
export function metas(html: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of tags(html, 'meta')) {
    const key = (attr(tag, 'name') || attr(tag, 'property')).toLowerCase();
    const content = attr(tag, 'content');
    if (key && content && !map.has(key)) map.set(key, content);
  }
  return map;
}

/** Addresses of scripts, frames and stylesheets the page loads. */
export function loaded(html: string): string[] {
  const out: string[] = [];
  for (const tag of tags(html, 'script')) out.push(attr(tag, 'src'));
  for (const tag of tags(html, 'iframe')) out.push(attr(tag, 'src') || attr(tag, 'data-src'));
  for (const tag of tags(html, 'link')) out.push(attr(tag, 'href'));
  return out.filter(Boolean);
}

export const title = (html: string): string => clean(html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1] ?? '', 120);

/** Structured data blocks (`application/ld+json`), flattened to a list of things. */
export function jsonLd(html: string): Record<string, unknown>[] {
  const things: Record<string, unknown>[] = [];
  const pattern = /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let blocks = 0;
  while (blocks++ < 30 && (match = pattern.exec(html))) {
    try {
      collect(JSON.parse(match[1].trim()), things, 0);
    } catch {
      // not valid JSON: skip it
    }
  }
  return things;
}

function collect(value: unknown, into: Record<string, unknown>[], depth: number): void {
  if (depth > 4 || into.length > 200 || !value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collect(item, into, depth + 1);
    return;
  }
  const thing = value as Record<string, unknown>;
  into.push(thing);
  if (thing['@graph']) collect(thing['@graph'], into, depth + 1);
}

/** The `@type` of a structured-data thing, as a list. */
export function typesOf(thing: Record<string, unknown>): string[] {
  const type = thing['@type'];
  return (Array.isArray(type) ? type : [type]).filter((t): t is string => typeof t === 'string');
}
