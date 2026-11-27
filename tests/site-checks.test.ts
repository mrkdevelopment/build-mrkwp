import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  brandingOf, decideFit, dnsHostOf, emailProviderOf, emptyResult, membersOf, platformOf, registrable, shopOf, sitemapChildren, sitemapUrls,
  socialOf, toolsOf, unreadable, whoOf,
} from '../src/lib/scan/checks.ts';
import { allowedUrl, isPrivateIp, newContext, normaliseAddress, safeFetch, type Fetched } from '../src/lib/scan/fetch.ts';
import { clean, jsonLd, links } from '../src/lib/scan/html.ts';
import { runScan } from '../src/lib/scan/run.ts';

const page = (text: string, url = 'https://smithplumbing.com.au/', headers: Record<string, string> = {}): Fetched => ({ ok: true, status: 200, url, headers, text });

test('addresses a client might type', () => {
  assert.equal(normaliseAddress('smithplumbing.com.au'), 'https://smithplumbing.com.au/');
  assert.equal(normaliseAddress('  HTTP://www.Smith-Plumbing.com.au/about?x=1 '), 'http://www.smith-plumbing.com.au/');
  for (const bad of ['', 'sam@smith.com.au', 'smith plumbing', 'localhost', 'http://127.0.0.1', '192.168.1.1', 'ftp://smith.com', 'smith.local', 'https://user:pw@smith.com', 'smith.com:8080', 'javascript:alert(1)']) {
    assert.equal(normaliseAddress(bad), null, bad);
  }
});

test('private and local network addresses are refused', () => {
  for (const ip of ['10.0.0.1', '127.0.0.1', '169.254.169.254', '172.16.5.5', '192.168.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fd00::1', 'fe80::1', '::ffff:10.0.0.1']) assert.ok(isPrivateIp(ip), ip);
  for (const ip of ['1.1.1.1', '203.2.218.214', '172.32.0.1', '2606:4700::6810:84e5']) assert.ok(!isPrivateIp(ip), ip);
  assert.ok(!allowedUrl(new URL('https://[::1]/')));
  assert.ok(!allowedUrl(new URL('https://intranet/')));
});

// A pretend internet: DNS answers and pages by address.
function pretend(dns: Record<string, string[]>, pages: Record<string, { status?: number; location?: string; body?: string }>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    if (url.hostname === 'cloudflare-dns.com') {
      const name = url.searchParams.get('name')!;
      const type = url.searchParams.get('type')!;
      const code = { A: 1, AAAA: 28, MX: 15, TXT: 16, NS: 2 }[type]!;
      return Response.json({ Answer: (dns[`${type} ${name}`] ?? []).map((data) => ({ type: code, data })) });
    }
    const found = pages[url.href];
    if (!found) return new Response('not here', { status: 404 });
    return new Response(found.body ?? '', { status: found.status ?? 200, headers: found.location ? { location: found.location } : {} });
  }) as typeof fetch;
}

test('a redirect to a private address is not followed', async () => {
  const net = pretend({ 'A good.com.au': ['203.2.218.214'], 'A inside.com.au': ['10.0.0.5'] }, { 'https://good.com.au/': { status: 302, location: 'https://inside.com.au/admin' } });
  const got = await safeFetch(newContext(5000, 40, net), 'https://good.com.au/');
  assert.equal(got.problem, 'refused');
  const direct = await safeFetch(newContext(5000, 40, net), 'https://inside.com.au/');
  assert.equal(direct.problem, 'refused');
  const nowhere = await safeFetch(newContext(5000, 40, net), 'https://nosuchsite.com.au/');
  assert.equal(nowhere.problem, 'missing');
});

test('text from a page is kept as plain, short text', () => {
  assert.equal(clean('  Smith &amp; Sons <script>alert(1)</script>\n Plumbing '), 'Smith & Sons alert(1) Plumbing');
  assert.equal(clean('x'.repeat(500)).length, 200);
  assert.equal(jsonLd('<script type="application/ld+json">{not json</script>').length, 0);
  assert.equal(links('<a href="javascript:alert(1)">x</a><a href="/about">About us</a>', 'https://a.com.au/').length, 1);
});

test('platform', () => {
  assert.equal(platformOf([page('<meta name="generator" content="WordPress 6.8">')]), 'WordPress');
  assert.equal(platformOf([page('<link href="/wp-content/themes/x/style.css">')]), 'WordPress');
  assert.equal(platformOf([page('<script src="https://cdn.shopify.com/s/files/1.js"></script>')]), 'Shopify');
  assert.equal(platformOf([page('<img src="https://static.wixstatic.com/media/a.png">')]), 'Wix');
  assert.equal(platformOf([page('<html data-wf-site="abc">')]), 'Webflow');
  assert.equal(platformOf([page('<p>Hello</p>')]), '');
});

test('an online shop is spotted, and a shop on another site is "links out"', () => {
  const woo = page('<body class="home woocommerce-no-js"><a href="/shop/">Shop</a>');
  assert.equal(shopOf([woo], woo).shop, 'yes');
  const ld = page('<script type="application/ld+json">{"@type":"Product","name":"Tap","offers":{"price":"20"}}</script>');
  assert.equal(shopOf([ld], ld).shop, 'yes');
  const etsy = page('<a href="https://www.etsy.com/shop/smith">Our Etsy shop</a>');
  assert.equal(shopOf([etsy], etsy).shop, 'links_out');
  const plain = page('<a href="/services/">Services</a><a href="/contact/">Contact</a>');
  assert.equal(shopOf([plain], plain).shop, 'no');
});

test("a members' area is spotted, and WordPress's own login is not one", () => {
  const portal = page('<a href="/client-portal/">Client login</a>');
  assert.ok(membersOf([portal], portal).members);
  const plugin = page('<link href="/wp-content/plugins/memberpress/css/ui.css">');
  assert.ok(membersOf([plugin], plugin).members);
  const wp = page('<a href="/wp-login.php">Log in</a><a href="https://login.xero.com/">Xero login</a><a href="/newsletter/">Subscribe</a>');
  assert.ok(!membersOf([wp], wp).members);
});

test('tools, business details, branding', () => {
  const home = page(`<title>Smith Plumbing | Parkes</title>
    <meta name="theme-color" content="#0A2540"><meta property="og:image" content="/share.png">
    <link rel="icon" href="/favicon.ico"><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Space+Grotesk">
    <script src="https://www.googletagmanager.com/gtag/js?id=G-ABC"></script><script src="https://assets.calendly.com/widget.js"></script>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Plumber","name":"Smith Plumbing","telephone":"02 6862 0000",
      "logo":{"url":"https://smithplumbing.com.au/logo.png"},"address":{"streetAddress":"1 Main St","addressLocality":"Parkes","addressRegion":"NSW","postalCode":"2870"},
      "sameAs":["https://www.facebook.com/smithplumbing/","https://www.facebook.com/sharer/sharer.php?u=x"]}]}</script>
    <a href="https://instagram.com/smithplumbing">Insta</a><a href="https://twitter.com/intent/tweet?text=hi">Tweet</a>`);
  assert.deepEqual(toolsOf([home]).map((t) => t.name), ['Calendly', 'Google Analytics']);
  const who = whoOf([home]);
  assert.deepEqual(who.business, { name: 'Smith Plumbing', phone: '02 6862 0000', address: '1 Main St, Parkes, NSW, 2870' });
  assert.deepEqual(who.socials, [{ network: 'Facebook', url: 'https://www.facebook.com/smithplumbing' }, { network: 'Instagram', url: 'https://instagram.com/smithplumbing' }]);
  const brand = brandingOf(home, who.logo);
  assert.equal(brand.logo, 'https://smithplumbing.com.au/logo.png');
  assert.equal(brand.theme_color, '#0a2540');
  assert.equal(brand.favicon, 'https://smithplumbing.com.au/favicon.ico');
  assert.deepEqual(brand.fonts, ['Outfit', 'Space Grotesk']);
  assert.equal(socialOf('https://www.facebook.com/'), null);
  assert.equal(socialOf('javascript:alert(1)'), null);
});

test('email, domain and size', () => {
  assert.equal(emailProviderOf(['0 smith-com-au.mail.protection.outlook.com.'], 'smith.com.au'), 'Microsoft 365');
  assert.equal(emailProviderOf(['1 aspmx.l.google.com.'], 'smith.com.au'), 'Google Workspace');
  assert.equal(emailProviderOf(['10 mail.smith.com.au.'], 'smith.com.au'), 'Your web host');
  assert.equal(emailProviderOf(null, 'smith.com.au'), '');
  assert.equal(dnsHostOf(['ns1.domaincontrol.com.', 'ns2.domaincontrol.com.']), 'GoDaddy');
  assert.equal(dnsHostOf(['amy.ns.cloudflare.com.']), 'Cloudflare');
  assert.equal(dnsHostOf(['ns1.littlehost.com.au.']), 'littlehost.com.au');
  assert.equal(registrable('www.shop.smith.com.au'), 'smith.com.au');
  assert.equal(registrable('www.smith.com'), 'smith.com');
  assert.equal(sitemapUrls('<urlset><url><loc>a</loc></url><url><loc>b</loc></url></urlset>'), 2);
  assert.deepEqual(sitemapChildren('<sitemapindex><sitemap><loc>https://a.com/p.xml</loc></sitemap></sitemapindex>'), ['https://a.com/p.xml']);
});

test('a page we cannot use', () => {
  assert.equal(unreadable({ ...page(''), ok: false, status: 0, problem: 'missing' }), 'missing');
  assert.equal(unreadable({ ...page('<title>Just a moment...</title>'), ok: false, status: 403 }), 'blocked');
  assert.equal(unreadable(page('<h1>This domain is for sale</h1><p>Buy this domain today.</p>')), 'parked');
  assert.equal(unreadable({ ...page('Not found'), ok: false, status: 404 }), 'error');
  assert.equal(unreadable(page('<h1>Smith Plumbing</h1><p>We fix taps in Parkes and Forbes.</p>')), '');
});

test('the fit decision', () => {
  const base = { ...emptyResult('https://a.com.au/'), reachable: true, platform: 'WordPress', pages: 12, pages_method: 'sitemap' as const };
  assert.equal(decideFit(base).fit, 'yes');
  assert.deepEqual(decideFit({ ...base, shop: 'yes' }), { fit: 'no', reasons: ['shop'] });
  assert.deepEqual(decideFit({ ...base, members: true }), { fit: 'no', reasons: ['members'] });
  assert.deepEqual(decideFit({ ...base, pages: 301 }), { fit: 'no', reasons: ['large'] });
  // An estimate is not enough to turn someone away: a person checks.
  assert.equal(decideFit({ ...base, pages: 900, pages_method: 'sitemap_estimate' }).fit, 'unsure');
  assert.equal(decideFit({ ...base, shop: 'links_out' }).fit, 'unsure');
  assert.equal(decideFit({ ...base, platform: '', pages: 1, pages_method: 'links' }).fit, 'unsure');
  // A site we couldn't read is looked at by a person, not turned away.
  assert.deepEqual(decideFit(emptyResult('https://a.com.au/')), { fit: 'unsure', reasons: ['unreadable'] });
});

test('a whole check of a pretend site', async () => {
  const net = pretend(
    { 'A smith.com.au': ['203.2.218.214'], 'MX smith.com.au': ['1 aspmx.l.google.com.'], 'TXT smith.com.au': ['"v=spf1 include:_spf.google.com ~all"'], 'NS smith.com.au': ['ns1.domaincontrol.com.'] },
    {
      'https://smith.com.au/': { body: '<title>Smith Plumbing</title><link href="/wp-content/themes/a.css"><a href="/about/">About</a><a href="/contact/">Contact</a><a href="tel:0268620000">Call</a>' },
      'https://smith.com.au/about/': { body: '<p>About us</p>' },
      'https://smith.com.au/contact/': { body: '<p>Contact us</p>' },
      'https://smith.com.au/sitemap.xml': { body: '<urlset><url></url><url></url><url></url><url></url></urlset>' },
    },
  );
  const result = await runScan('https://smith.com.au/', net);
  assert.equal(result.reachable, true);
  assert.equal(result.platform, 'WordPress');
  assert.equal(result.pages, 4);
  assert.equal(result.business.name, 'Smith Plumbing');
  assert.equal(result.business.phone, '0268620000');
  assert.equal(result.email_provider, 'Google Workspace');
  assert.equal(result.spf, true);
  assert.equal(result.dmarc, false);
  assert.equal(result.dns_host, 'GoDaddy');
  assert.equal(result.fit, 'yes');

  const gone = await runScan('https://nosuchsite.com.au/', net);
  assert.equal(gone.reachable, false);
  assert.equal(gone.reason, 'missing');
  assert.equal(gone.fit, 'unsure');
});
