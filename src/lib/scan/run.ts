// One web address in, one result out, in about ten seconds. Each check has its own time limit, and
// a failure in one never stops the others.
import {
  brandingOf, countLinks, decideFit, dnsHostOf, emailProviderOf, emptyResult, hostOf, membersOf, pagesToRead, platformOf,
  registrable, sameSite, shopOf, sitemapChildren, sitemapUrls, toolsOf, unreadable, whoOf, type ScanResult,
} from './checks.ts';
import { dnsLookup, newContext, safeFetch, type Fetched, type ScanContext } from './fetch.ts';
import { clean } from './html.ts';

const OVERALL_MS = 12_000;

/** A check that fails or runs out of time gives its fallback instead of stopping the scan. */
const safely = async <T>(work: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await work;
  } catch {
    return fallback;
  }
};

async function sizeOf(ctx: ScanContext, home: Fetched): Promise<Pick<ScanResult, 'pages' | 'pages_method'>> {
  const origin = new URL(home.url).origin;
  const host = hostOf(home.url);
  const robots = await safeFetch(ctx, origin + '/robots.txt', 'text/plain');
  const listed = robots.ok ? [...robots.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]).filter((address) => sameSite(hostOf(address), host)) : [];

  let map: Fetched | null = null;
  for (const address of [...listed.slice(0, 1), origin + '/sitemap.xml', origin + '/wp-sitemap.xml'].slice(0, 3)) {
    const got = await safeFetch(ctx, address, 'application/xml,text/xml');
    if (got.ok && /<(?:urlset|sitemapindex)[\s>]/i.test(got.text)) {
      map = got;
      break;
    }
  }
  if (!map) return { pages: countLinks(home), pages_method: 'links' };

  const children = sitemapChildren(map.text).filter((address) => sameSite(hostOf(address), host));
  if (children.length === 0) return { pages: sitemapUrls(map.text), pages_method: 'sitemap' };

  const read = await Promise.all(children.slice(0, 3).map((address) => safeFetch(ctx, address, 'application/xml,text/xml')));
  const counts = read.filter((child) => child.ok).map((child) => sitemapUrls(child.text));
  if (counts.length === 0) return { pages: countLinks(home), pages_method: 'links' };
  const total = counts.reduce((sum, n) => sum + n, 0);
  if (children.length <= counts.length) return { pages: total, pages_method: 'sitemap' };
  // More sitemap files than we read: estimate from the ones we did.
  return { pages: Math.round((total / counts.length) * children.length), pages_method: 'sitemap_estimate' };
}

async function registrarOf(ctx: ScanContext, domain: string): Promise<string> {
  // The .au registry publishes no machine-readable record, so there is nothing to ask.
  if (domain.endsWith('.au')) return '';
  const got = await safeFetch(ctx, `https://rdap.org/domain/${domain}`, 'application/rdap+json,application/json');
  if (!got.ok) return '';
  const data = JSON.parse(got.text) as { entities?: { roles?: string[]; vcardArray?: [string, [string, unknown, string, unknown][]] }[] };
  const registrar = data.entities?.find((entity) => entity.roles?.includes('registrar'));
  const name = registrar?.vcardArray?.[1]?.find((field) => field[0] === 'fn')?.[3];
  return clean(name, 80);
}

export async function runScan(address: string, fetcher?: typeof fetch): Promise<ScanResult> {
  const ctx = newContext(OVERALL_MS, 40, fetcher);
  const result = emptyResult(address);

  let home = await safeFetch(ctx, address);
  // Some small sites still answer only on plain http.
  if (home.problem === 'network' && address.startsWith('https://')) home = await safeFetch(ctx, 'http://' + address.slice(8));

  result.reason = unreadable(home);
  result.reachable = result.reason === '';
  result.final_url = home.url;
  const domain = registrable(hostOf(home.url) || hostOf(address));

  // Records about the domain can be read even when the site itself can't.
  const records = Promise.all([
    dnsLookup(ctx, domain, 'MX'),
    dnsLookup(ctx, domain, 'TXT'),
    dnsLookup(ctx, '_dmarc.' + domain, 'TXT'),
    dnsLookup(ctx, domain, 'NS'),
    safely(registrarOf(ctx, domain), ''),
  ]);

  if (result.reachable) {
    const more = pagesToRead(home);
    const [shopPages, aboutPages, size] = await Promise.all([
      Promise.all(more.shop.map((page) => safeFetch(ctx, page))),
      Promise.all(more.about.map((page) => safeFetch(ctx, page))),
      safely(sizeOf(ctx, home), { pages: null, pages_method: 'none' as const }),
    ]);
    const pages = [home, ...shopPages, ...aboutPages].filter((page) => page.ok);

    result.platform = safely_(() => platformOf(pages), '');
    const shop = safely_(() => shopOf(pages, home), { shop: 'no' as const, signs: [] });
    result.shop = shop.shop;
    result.shop_signs = shop.signs;
    const members = safely_(() => membersOf(pages, home), { members: false, signs: [] });
    result.members = members.members;
    result.member_signs = members.signs;
    result.tools = safely_(() => toolsOf(pages), []);
    const who = safely_(() => whoOf([home, ...aboutPages.filter((page) => page.ok)]), { business: result.business, socials: [], logo: '' });
    result.business = who.business;
    result.socials = who.socials;
    result.branding = safely_(() => brandingOf(home, who.logo), result.branding);
    result.pages = size.pages;
    result.pages_method = size.pages_method;
  }

  const [mx, txt, dmarc, ns, registrar] = await records;
  result.email_provider = emailProviderOf(mx, domain);
  result.spf = txt === null ? null : txt.some((record) => /v=spf1/i.test(record));
  result.dmarc = dmarc === null ? null : dmarc.some((record) => /v=DMARC1/i.test(record));
  result.dns_host = dnsHostOf(ns);
  result.registrar = registrar;

  const fit = decideFit(result);
  result.fit = fit.fit;
  result.fit_reasons = fit.reasons;
  return result;
}

function safely_<T>(work: () => T, fallback: T): T {
  try {
    return work();
  } catch {
    return fallback;
  }
}
