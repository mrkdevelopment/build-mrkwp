// Fetching a stranger's web address safely. Everything the site checks request goes through here.
//
// The rules (section 5 of the specification): only http and https, never an address that points
// at a private or local network (checked again after every redirect), at most 2 MB and 5 seconds
// per request, and an honest user agent. What comes back is text to be read, never run.

export const USER_AGENT = 'MRKWP-Build-SiteCheck/1.0 (+https://www.mrkwp.com/contact/)';
export const MAX_BYTES = 2_000_000;
export const REQUEST_MS = 5000;
export const MAX_REDIRECTS = 5;

const DOH = 'https://cloudflare-dns.com/dns-query';
const LOCAL_ENDINGS = ['.local', '.localhost', '.internal', '.lan', '.home', '.corp', '.test', '.invalid', '.example', '.onion'];

/** Shared by every request of one scan: a cap on how many requests it may make, and one deadline. */
export interface ScanContext {
  left: number;
  signal: AbortSignal;
  /** Host name to "is it public", so each host is looked up once. */
  hosts: Map<string, Promise<HostCheck>>;
  fetch: typeof fetch;
}

export type HostCheck = 'public' | 'private' | 'missing';

export type FetchProblem = 'refused' | 'missing' | 'timeout' | 'network' | 'redirects' | 'budget';

export interface Fetched {
  ok: boolean;
  status: number;
  /** The address after redirects. */
  url: string;
  headers: Record<string, string>;
  text: string;
  problem?: FetchProblem;
}

export function newContext(overallMs: number, requests = 40, fetcher?: typeof fetch): ScanContext {
  // Workers refuse a `fetch` that is called as a property of another object, so it is wrapped.
  const plain = ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, init)) as typeof fetch;
  return { left: requests, signal: AbortSignal.timeout(overallMs), hosts: new Map(), fetch: fetcher ?? plain };
}

/** An IPv4 or IPv6 address that is not on the public internet. */
export function isPrivateIp(ip: string): boolean {
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b, c] = v4.slice(1).map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  const v6 = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (!v6.includes(':')) return true; // not an address we understand
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);
  return (
    v6 === '::' || v6 === '::1' ||
    /^f[cd]/.test(v6) || // fc00::/7, private
    /^fe[89ab]/.test(v6) || // fe80::/10, link-local
    v6.startsWith('ff') || // multicast
    v6.startsWith('::ffff:') ||
    v6.startsWith('64:ff9b:') ||
    v6.startsWith('2001:db8:')
  );
}

/** A web address we are willing to request: http or https, a real host name, the usual port. */
export function allowedUrl(url: URL): boolean {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  if (url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  if (host.length > 253 || !host.includes('.') || host.includes(':')) return false;
  if (/^[\d.]+$/.test(host)) return false; // an IP address typed directly
  if (LOCAL_ENDINGS.some((ending) => host.endsWith(ending))) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(host);
}

/** What a client typed, as the home page of that site, or null if it isn't a web address. */
export function normaliseAddress(raw: string): string | null {
  let text = raw.trim();
  if (!text || text.length > 300 || /\s/.test(text) || text.includes('@')) return null;
  if (!/^https?:\/\//i.test(text)) text = 'https://' + text.replace(/^\/+/, '');
  try {
    const url = new URL(text);
    return allowedUrl(url) ? `${url.protocol}//${url.hostname.toLowerCase()}/` : null;
  } catch {
    return null;
  }
}

/** One DNS question, asked over HTTPS. Returns the answers' data for that record type. */
export async function dnsLookup(ctx: ScanContext, name: string, type: 'A' | 'AAAA' | 'MX' | 'TXT' | 'NS'): Promise<string[] | null> {
  if (ctx.left <= 0) return null;
  ctx.left--;
  const wanted = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2 }[type];
  try {
    const response = await ctx.fetch(`${DOH}?name=${encodeURIComponent(name)}&type=${type}`, {
      headers: { Accept: 'application/dns-json' },
      signal: AbortSignal.any([ctx.signal, AbortSignal.timeout(REQUEST_MS)]),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { Answer?: { type: number; data: string }[] };
    return (data.Answer ?? []).filter((answer) => answer.type === wanted).map((answer) => answer.data);
  } catch {
    return null;
  }
}

/** Does this host name lead to the public internet? Looked up once per scan. */
export function checkHost(ctx: ScanContext, host: string): Promise<HostCheck> {
  let check = ctx.hosts.get(host);
  if (!check) {
    check = (async (): Promise<HostCheck> => {
      const [a, aaaa] = await Promise.all([dnsLookup(ctx, host, 'A'), dnsLookup(ctx, host, 'AAAA')]);
      // If the lookup itself failed we cannot vouch for the host, so it is refused.
      if (a === null && aaaa === null) return 'private';
      const addresses = [...(a ?? []), ...(aaaa ?? [])];
      if (addresses.length === 0) return 'missing';
      return addresses.some(isPrivateIp) ? 'private' : 'public';
    })();
    ctx.hosts.set(host, check);
  }
  return check;
}

async function readCapped(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value.subarray(0, MAX_BYTES - size));
    size += value.byteLength;
  }
  await reader.cancel().catch(() => {});
  const bytes = new Uint8Array(Math.min(size, MAX_BYTES));
  let at = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

const failed = (url: string, problem: FetchProblem): Fetched => ({ ok: false, status: 0, url, headers: {}, text: '', problem });

/** GET an address, following redirects ourselves so each hop is checked before it is requested. */
export async function safeFetch(ctx: ScanContext, address: string, accept = 'text/html,application/xhtml+xml'): Promise<Fetched> {
  let current = address;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let url: URL;
    try {
      url = new URL(current);
    } catch {
      return failed(current, 'refused');
    }
    if (!allowedUrl(url)) return failed(current, 'refused');
    const host = await checkHost(ctx, url.hostname.toLowerCase());
    if (host === 'missing') return failed(current, 'missing');
    if (host !== 'public') return failed(current, 'refused');
    if (ctx.left <= 0) return failed(current, 'budget');
    ctx.left--;

    let response: Response;
    try {
      response = await ctx.fetch(url.href, {
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT, Accept: accept, 'Accept-Language': 'en-AU,en;q=0.8' },
        signal: AbortSignal.any([ctx.signal, AbortSignal.timeout(REQUEST_MS)]),
      });
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      return failed(current, name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network');
    }

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel().catch(() => {});
      try {
        current = new URL(location, url).href;
      } catch {
        return failed(current, 'refused');
      }
      continue;
    }

    try {
      const text = await readCapped(response);
      return { ok: response.ok, status: response.status, url: url.href, headers: Object.fromEntries(response.headers), text };
    } catch {
      return failed(current, 'timeout');
    }
  }
  return failed(current, 'redirects');
}
