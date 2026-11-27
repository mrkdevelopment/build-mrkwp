// What the site checks look for, as plain functions over fetched pages. No requests are made here,
// so every rule can be tested with a made-up page.
import type { Fetched } from './fetch.ts';
import { attr, clean, jsonLd, links, loaded, metas, tags, telLinks, title, typesOf, type Link } from './html.ts';

export type Fit = 'yes' | 'no' | 'unsure';

export interface Tool {
  name: string;
  kind: string;
}

export interface Social {
  network: string;
  url: string;
}

export interface ScanResult {
  address: string;
  reachable: boolean;
  /** Why it couldn't be read, when it couldn't. */
  reason: '' | 'missing' | 'blocked' | 'parked' | 'error' | 'slow' | 'limit';
  final_url: string;
  platform: string;
  shop: 'yes' | 'no' | 'links_out';
  shop_signs: string[];
  members: boolean;
  member_signs: string[];
  pages: number | null;
  pages_method: 'sitemap' | 'sitemap_estimate' | 'links' | 'none';
  tools: Tool[];
  business: { name: string; phone: string; address: string };
  socials: Social[];
  branding: { logo: string; favicon: string; theme_color: string; share_image: string; fonts: string[] };
  email_provider: string;
  spf: boolean | null;
  dmarc: boolean | null;
  dns_host: string;
  registrar: string;
  fit: Fit;
  fit_reasons: string[];
  scanned_at: string;
}

export const emptyResult = (address: string): ScanResult => ({
  address,
  reachable: false,
  reason: '',
  final_url: '',
  platform: '',
  shop: 'no',
  shop_signs: [],
  members: false,
  member_signs: [],
  pages: null,
  pages_method: 'none',
  tools: [],
  business: { name: '', phone: '', address: '' },
  socials: [],
  branding: { logo: '', favicon: '', theme_color: '', share_image: '', fonts: [] },
  email_provider: '',
  spf: null,
  dmarc: null,
  dns_host: '',
  registrar: '',
  fit: 'unsure',
  fit_reasons: [],
  scanned_at: new Date().toISOString(),
});

const any = (text: string, patterns: RegExp[]): boolean => patterns.some((p) => p.test(text));
const unique = <T>(list: T[]): T[] => [...new Set(list)];

/** Everything about a page that markers are matched against: its HTML and the headers it came with. */
const haystack = (page: Fetched): string => page.text + '\n' + Object.entries(page.headers).map(([k, v]) => `${k}: ${v}`).join('\n');

// ---------------------------------------------------------------------------------------------
// Could we read it at all?

const PARKED = [/this domain (?:name )?is (?:for sale|parked)/i, /buy this domain/i, /domain (?:is )?parked/i, /sedoparking|parkingcrew|bodis\.com|above\.com\/marketplace|dan\.com\/buy-domain|afternic\.com\/forsale/i, /parked free,? courtesy of/i];
const CHALLENGE = [/just a moment\.\.\./i, /cf-chl-|challenge-platform|__cf_chl/i, /attention required! \| cloudflare/i, /sucuri website firewall/i, /access denied.{0,80}(?:akamai|imperva|incapsula)/is, /are you a robot|verify you are (?:a )?human/i];

/** Why the home page can't be used, or '' when it can. */
export function unreadable(home: Fetched): ScanResult['reason'] {
  if (home.problem === 'missing') return 'missing';
  if (home.problem === 'timeout') return 'slow';
  if (home.problem) return 'error';
  if ([401, 403, 406, 429, 503].includes(home.status) || (home.status >= 400 && any(home.text, CHALLENGE))) return 'blocked';
  if (!home.ok) return 'error';
  if (any(home.text.slice(0, 60_000), CHALLENGE) && home.text.length < 30_000) return 'blocked';
  if (any(home.text.slice(0, 60_000), PARKED)) return 'parked';
  if (home.text.replace(/<[^>]*>/g, '').trim().length < 20 && !/<(?:script|frame|iframe)\b/i.test(home.text)) return 'error';
  return '';
}

// ---------------------------------------------------------------------------------------------
// Platform

const PLATFORMS: [string, RegExp[]][] = [
  ['Shopify', [/cdn\.shopify\.com|myshopify\.com|x-shopify-|shopify\.theme/i]],
  ['Wix', [/static\.wixstatic\.com|static\.parastorage\.com|x-wix-request-id|wix-code-sdk/i]],
  ['Squarespace', [/static1\.squarespace\.com|squarespace-cdn\.com|server: squarespace/i]],
  ['Webflow', [/data-wf-site|assets\.website-files\.com|cdn\.prod\.website-files\.com|webflow\.js/i]],
  ['WordPress', [/\/wp-content\/|\/wp-includes\/|wp-json|x-pingback:/i]],
  ['Joomla', [/\/media\/jui\/|\/media\/system\/js\/|com_content/i]],
  ['Drupal', [/drupal-settings-json|\/sites\/default\/files\/|x-drupal-cache|x-generator: drupal/i]],
];

export function platformOf(pages: Fetched[]): string {
  const home = pages[0];
  if (!home) return '';
  const generator = metas(home.text).get('generator') ?? '';
  for (const [name] of PLATFORMS) if (new RegExp(`\\b${name}\\b`, 'i').test(generator)) return name;
  if (/wix\.com/i.test(generator)) return 'Wix';
  const text = haystack(home);
  for (const [name, patterns] of PLATFORMS) if (any(text, patterns)) return name;
  return clean(generator.split(/[\s;,]/)[0], 40) && /^[a-z][\w.+-]{1,30}$/i.test(generator.split(/[\s;,]/)[0]) ? clean(generator.split(/[\s;,]/)[0], 40) : '';
}

// ---------------------------------------------------------------------------------------------
// Shop

const SHOP_MARKERS: [string, RegExp][] = [
  ['WooCommerce', /\/plugins\/woocommerce\/|class="[^"]*\bwoocommerce\b|wc-ajax=|woocommerce-no-js/i],
  ['Shopify', /cdn\.shopify\.com|myshopify\.com|action="\/cart\/add"/i],
  ['BigCommerce', /cdn\d*\.bigcommerce\.com|stencil-utils|bigcommerce\.com\/s-/i],
  ['Wix Stores', /wix-?stores|wixstores|"appDefinitionName":"Wix ?Stores"/i],
  ['Squarespace Commerce', /sqs-add-to-cart-button|squarespace\.commerce|"storeSettings"|sqs-cart-dropzone/i],
  ['Ecwid', /app\.ecwid\.com|ecwid\.com\/script\.js|ec-store/i],
  ['an add-to-cart button', /add[-_]to[-_]cart|name="add-to-cart"|class="[^"]*\bsingle_add_to_cart_button\b/i],
];
const SHOPS_ELSEWHERE = /(?:^|\.)(?:etsy\.com|ebay\.com(?:\.au)?|amazon\.com(?:\.au)?|myshopify\.com|square\.site|bigcartel\.com|redbubble\.com|gumroad\.com|shop\.app)$/i;
const SHOP_WORDS = /\b(shop|store|buy|order online|products)\b/i;

export function shopOf(pages: Fetched[], home: Fetched): { shop: ScanResult['shop']; signs: string[] } {
  const signs: string[] = [];
  for (const page of pages) {
    const text = haystack(page);
    for (const [name, pattern] of SHOP_MARKERS) if (pattern.test(text)) signs.push(name);
    for (const thing of jsonLd(page.text)) {
      if (typesOf(thing).includes('Product') && thing.offers) signs.push('products with prices');
    }
  }
  if (signs.length) return { shop: 'yes', signs: unique(signs).slice(0, 5) };

  const host = hostOf(home.url);
  const out = links(home.text, home.url).filter((link) => !sameSite(link.url.hostname, host) && (SHOPS_ELSEWHERE.test(link.url.hostname) || (SHOP_WORDS.test(link.text) && /^(shop|store)\./i.test(link.url.hostname))));
  return out.length ? { shop: 'links_out', signs: unique(out.map((link) => link.url.hostname.replace(/^www\./, ''))).slice(0, 3) } : { shop: 'no', signs: [] };
}

// ---------------------------------------------------------------------------------------------
// Members' area

const MEMBER_PLUGINS: [string, RegExp][] = [
  ['MemberPress', /\/plugins\/memberpress\/|mepr-/i],
  ['Paid Memberships Pro', /\/plugins\/paid-memberships-pro\/|pmpro[-_]/i],
  ['Restrict Content Pro', /\/plugins\/restrict-content(?:-pro)?\//i],
  ['WooCommerce Memberships', /\/plugins\/woocommerce-memberships\//i],
  ['LearnDash', /\/plugins\/sfwd-lms\/|learndash/i],
  ['WishList Member', /\/plugins\/wishlist-member\//i],
  ['Ultimate Member', /\/plugins\/ultimate-member\//i],
  ['BuddyPress', /\/plugins\/(?:buddypress|buddyboss-platform)\//i],
  ['MemberMouse', /\/plugins\/membermouse\//i],
  ['Memberstack', /memberstack\.(?:com|io)|data-ms-member/i],
  ['Kajabi', /kajabi-cdn|kajabi\.com/i],
  ['Wix Members', /wix-members|"appDefinitionName":"Wix Members/i],
];
const MEMBER_PATH = /\/(?:my-account|members?(?:-area|ship)?|member-login|client-(?:login|portal|area)|portal|login|log-in|signin|sign-in|account|dashboard)(?:\/|$)/i;
const MEMBER_TEXT = /\b(member(?:s|ship)? (?:login|area|portal|sign ?in)|members? only|client (?:login|portal|area)|my account|log ?in|sign ?in)\b/i;
const NOT_MEMBERS = /wp-login\.php|wp-admin|\/cart|\/checkout|newsletter|subscribe/i;

export function membersOf(pages: Fetched[], home: Fetched): { members: boolean; signs: string[] } {
  const signs: string[] = [];
  for (const page of pages) {
    const text = haystack(page);
    for (const [name, pattern] of MEMBER_PLUGINS) if (pattern.test(text)) signs.push(name);
  }
  const host = hostOf(home.url);
  for (const link of links(home.text, home.url)) {
    if (!sameSite(link.url.hostname, host) || NOT_MEMBERS.test(link.url.href)) continue;
    if (MEMBER_PATH.test(link.url.pathname) || (MEMBER_TEXT.test(link.text) && /log|sign|member|account|portal/i.test(link.url.pathname))) {
      signs.push(`a "${link.text || 'log in'}" link`);
    }
  }
  return { members: signs.length > 0, signs: unique(signs).slice(0, 5) };
}

// ---------------------------------------------------------------------------------------------
// Tools

const TOOLS: [string, string, RegExp][] = [
  ['HubSpot', 'crm', /js\.hs-scripts\.com|js\.hsforms\.net|hs-analytics\.net|hubspot\.com/i],
  ['Mailchimp', 'crm', /chimpstatic\.com|list-manage\.com|mailchimp\.com/i],
  ['ActiveCampaign', 'crm', /activehosted\.com|trackcmp\.net|activecampaign\.com/i],
  ['FluentCRM', 'crm', /fluentcrm|\/plugins\/fluentform/i],
  ['Klaviyo', 'crm', /klaviyo\.com/i],
  ['Calendly', 'booking', /calendly\.com/i],
  ['Acuity Scheduling', 'booking', /acuityscheduling\.com|squarespacescheduling\.com/i],
  ['Square Appointments', 'booking', /squareup\.com\/appointments|square\.site\/book|book\.squareup\.com/i],
  ['Fresha', 'booking', /fresha\.com/i],
  ['ServiceM8', 'booking', /servicem8\.com/i],
  ['Intercom', 'chat', /widget\.intercom\.io|intercomcdn\.com/i],
  ['Tidio', 'chat', /code\.tidio\.co|tidio\.com/i],
  ['Tawk.to', 'chat', /embed\.tawk\.to/i],
  ['Facebook Messenger chat', 'chat', /connect\.facebook\.net\/[^"']*customerchat/i],
  ['Stripe', 'payments', /js\.stripe\.com|buy\.stripe\.com|checkout\.stripe\.com/i],
  ['PayPal', 'payments', /paypal\.com\/sdk\/js|paypalobjects\.com|paypal\.com\/(?:donate|cgi-bin\/webscr)/i],
  ['Google Maps', 'maps', /maps\.googleapis\.com|google\.com\/maps\/embed|maps\.google\.com/i],
  ['Google Analytics', 'analytics', /google-analytics\.com|googletagmanager\.com\/gtag\/js|gtag\(['"]config['"],\s*['"]G-/i],
  ['Google Tag Manager', 'analytics', /googletagmanager\.com\/gtm\.js|googletagmanager\.com\/ns\.html/i],
  ['Microsoft Clarity', 'analytics', /clarity\.ms/i],
  ['Hotjar', 'analytics', /static\.hotjar\.com/i],
  ['Meta Pixel', 'ads', /connect\.facebook\.net\/[^"']*fbevents\.js|facebook\.com\/tr\?/i],
  ['Google Ads', 'ads', /googleadservices\.com|gtag\(['"]config['"],\s*['"]AW-/i],
  ['LinkedIn Insight', 'ads', /snap\.licdn\.com/i],
  ['TikTok Pixel', 'ads', /analytics\.tiktok\.com/i],
  ['YouTube videos', 'video', /youtube(?:-nocookie)?\.com\/embed/i],
  ['Vimeo videos', 'video', /player\.vimeo\.com/i],
  ['Google reCAPTCHA', 'forms', /google\.com\/recaptcha|recaptcha\/api\.js/i],
  ['Gravity Forms', 'forms', /\/plugins\/gravityforms\//i],
  ['Contact Form 7', 'forms', /\/plugins\/contact-form-7\//i],
  ['WPForms', 'forms', /\/plugins\/wpforms/i],
  ['Typeform', 'forms', /typeform\.com/i],
  ['Jotform', 'forms', /jotform\.com/i],
  ['Trustpilot', 'reviews', /widget\.trustpilot\.com/i],
  ['Elfsight widgets', 'widgets', /elfsight\.com|elfsightcdn\.com/i],
];

export function toolsOf(pages: Fetched[]): Tool[] {
  // Addresses of what the page loads, plus the page itself for snippets pasted inline.
  const text = pages.map((page) => loaded(page.text).join('\n') + '\n' + page.text).join('\n');
  return TOOLS.filter(([, , pattern]) => pattern.test(text)).map(([name, kind]) => ({ name, kind }));
}

// ---------------------------------------------------------------------------------------------
// Who they are

const NETWORKS: [string, RegExp][] = [
  ['Facebook', /(?:^|\.)(?:facebook|fb)\.com$/i],
  ['Instagram', /(?:^|\.)instagram\.com$/i],
  ['LinkedIn', /(?:^|\.)linkedin\.com$/i],
  ['YouTube', /(?:^|\.)youtube\.com$/i],
  ['TikTok', /(?:^|\.)tiktok\.com$/i],
  ['X', /(?:^|\.)(?:x|twitter)\.com$/i],
  ['Pinterest', /(?:^|\.)pinterest\.com(?:\.au)?$/i],
];
const SHARE_LINK = /\/(?:sharer|share|intent|dialog|plugins|tr|hashtag|search|login|policies|help|legal|privacy|terms)\b|shareArticle|[?&](?:u|url|text)=/i;

export function socialOf(raw: string): Social | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  const network = NETWORKS.find(([, host]) => host.test(url.hostname))?.[0];
  if (!network || SHARE_LINK.test(url.pathname + url.search) || url.pathname.replace(/\/+$/, '') === '') return null;
  return { network, url: `https://${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, '')}`.slice(0, 200) };
}

const ORG_TYPES = /Organization|LocalBusiness|Corporation|Store|Service|Professional|Business|Restaurant|Dentist|Physician|Plumber|Electrician|Contractor|Agent|Salon|Clinic/;

function postalAddress(value: unknown): string {
  if (typeof value === 'string') return clean(value, 200);
  if (!value || typeof value !== 'object') return '';
  const a = (Array.isArray(value) ? value[0] : value) as Record<string, unknown>;
  if (!a || typeof a !== 'object') return '';
  return clean([a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode].map((part) => clean(part, 80)).filter(Boolean).join(', '), 200);
}

const imageUrl = (value: unknown, base: string): string => {
  const raw = typeof value === 'string' ? value : value && typeof value === 'object' ? ((Array.isArray(value) ? value[0] : value) as Record<string, unknown>)?.url : '';
  return absolute(typeof raw === 'string' ? raw : '', base);
};

/** A link or picture address from a page, as a full https address, or ''. */
export function absolute(raw: string, base: string): string {
  if (!raw || raw.startsWith('data:')) return '';
  try {
    const url = new URL(raw, base);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

export function whoOf(pages: Fetched[]): { business: ScanResult['business']; socials: Social[]; logo: string } {
  const business = { name: '', phone: '', address: '' };
  const socials: Social[] = [];
  let logo = '';

  for (const page of pages) {
    for (const thing of jsonLd(page.text)) {
      if (!typesOf(thing).some((type) => ORG_TYPES.test(type))) continue;
      business.name ||= clean(thing.name, 120);
      business.phone ||= clean(thing.telephone, 30);
      business.address ||= postalAddress(thing.address);
      logo ||= imageUrl(thing.logo, page.url);
      const same = thing.sameAs;
      for (const item of Array.isArray(same) ? same : [same]) {
        const social = typeof item === 'string' ? socialOf(item) : null;
        if (social) socials.push(social);
      }
    }
  }

  const home = pages[0];
  if (home) {
    const meta = metas(home.text);
    business.name ||= clean(meta.get('og:site_name'), 120) || clean(title(home.text).split(/\s+[|<>\u2013\u2014\u2039\u203a\u00ab\u00bb\u00b7-]\s+/)[0], 120);
    business.phone ||= telLinks(home.text)[0] ?? '';
  }
  for (const page of pages) {
    for (const link of links(page.text, page.url)) {
      const social = socialOf(link.url.href);
      if (social) socials.push(social);
    }
  }
  // One profile per network: the first one found.
  const seen = new Set<string>();
  return { business, socials: socials.filter((s) => !seen.has(s.network) && seen.add(s.network)).slice(0, 7), logo };
}

// ---------------------------------------------------------------------------------------------
// Branding

const GENERIC_FONTS = /^(?:inherit|initial|unset|sans-serif|serif|monospace|system-ui|ui-sans-serif|ui-serif|ui-monospace|cursive|fantasy|emoji|math|-apple-system|blinkmacsystemfont|segoe ui|helvetica neue|helvetica|arial|times new roman|times|georgia|verdana|tahoma|courier new|courier|roboto mono|apple color emoji|segoe ui emoji|segoe ui symbol|noto color emoji|var\(.*)$/i;
const ICON_FONTS = /icon|awesome|dashicons|glyph|symbol|eicons|swiper|slick|star|woocommerce|genericons|ionicons|material/i;

export function brandingOf(home: Fetched, logoFromData: string): ScanResult['branding'] {
  const meta = metas(home.text);
  let logo = logoFromData;
  if (!logo) {
    const img = tags(home.text.slice(0, 200_000), 'img').find((tag) => /logo/i.test(attr(tag, 'class') + attr(tag, 'id') + attr(tag, 'alt') + attr(tag, 'src')));
    logo = img ? absolute(attr(img, 'src') || attr(img, 'data-src'), home.url) : '';
  }
  const iconTag = tags(home.text, 'link').find((tag) => /\bicon\b/i.test(attr(tag, 'rel')));
  const colour = (meta.get('theme-color') ?? meta.get('msapplication-tilecolor') ?? '').trim();

  const fonts: string[] = [];
  for (const tag of tags(home.text, 'link')) {
    const href = attr(tag, 'href');
    if (/fonts\.googleapis\.com/i.test(href)) {
      for (const match of href.matchAll(/family=([^&:]+)/g)) fonts.push(...decodeURIComponent(match[1].replace(/\+/g, ' ')).split('|'));
    }
  }
  for (const match of home.text.matchAll(/font-family\s*:\s*([^;}{<]{1,120})/gi)) {
    const first = match[1].split(',')[0].replace(/["'!]|important/gi, '').trim();
    if (first) fonts.push(first);
  }

  return {
    logo: /^https:/.test(logo) ? logo : '',
    favicon: absolute(iconTag ? attr(iconTag, 'href') : '', home.url),
    theme_color: /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(colour) ? colour.toLowerCase() : '',
    share_image: absolute(meta.get('og:image') ?? '', home.url),
    fonts: unique(fonts.map((font) => clean(font, 40).replace(/-[0-9a-f]{12,}$/i, '')).filter((font) => font && /^[\w .'-]{2,40}$/.test(font) && !GENERIC_FONTS.test(font) && !ICON_FONTS.test(font))).slice(0, 4),
  };
}

// ---------------------------------------------------------------------------------------------
// Email, domain

export function emailProviderOf(mx: string[] | null, domain: string): string {
  if (mx === null) return '';
  if (mx.length === 0) return 'No email set up on this domain';
  const hosts = mx.map((record) => record.split(/\s+/).pop()!.toLowerCase().replace(/\.$/, ''));
  if (hosts.some((h) => /\.outlook\.com$|\.protection\.outlook\.com$/.test(h))) return 'Microsoft 365';
  if (hosts.some((h) => /(?:^|\.)google\.com$|googlemail\.com$/.test(h))) return 'Google Workspace';
  if (hosts.some((h) => /zoho\.com/.test(h))) return 'Zoho Mail';
  if (hosts.some((h) => /messagingengine\.com$/.test(h))) return 'Fastmail';
  if (hosts.some((h) => /protonmail\.ch$|proton\.me$/.test(h))) return 'Proton Mail';
  if (hosts.some((h) => /mimecast|pphosted\.com|barracudanetworks|mailguard\.com\.au|messagelabs/.test(h))) return 'An email filtering service';
  if (hosts.some((h) => /secureserver\.net$/.test(h))) return 'GoDaddy email';
  if (hosts.some((h) => h === domain || h.endsWith('.' + domain))) return 'Your web host';
  return 'Another provider';
}

const DNS_HOSTS: [string, RegExp][] = [
  ['Cloudflare', /\.ns\.cloudflare\.com$/],
  ['GoDaddy', /\.domaincontrol\.com$/],
  ['Crazy Domains', /crazydomains\.com|dreamscape/],
  ['VentraIP', /ventraip|nameserver\.net\.au$|synergywholesale/],
  ['Amazon Route 53', /awsdns-/],
  ['Wix', /wixdns\.net$/],
  ['Squarespace', /squarespacedns\.com$|googledomains\.com$/],
  ['Shopify', /myshopify\.com$/],
  ['Namecheap', /registrar-servers\.com$|namecheaphosting/],
  ['Netregistry', /netregistry\.net$/],
  ['Melbourne IT', /melbourneit\.(?:com|net)(?:\.au)?$/],
  ['Digital Pacific', /digitalpacific\.com\.au$/],
  ['SiteGround', /siteground\.net$|sgvps\.net$/],
  ['Hostinger', /dns-parking\.com$|hostinger/],
  ['Bluehost', /bluehost\.com$/],
  ['HostGator', /hostgator\.com(?:\.au)?$/],
  ['DigitalOcean', /digitalocean\.com$/],
  ['Microsoft Azure', /azure-dns\./],
  ['Google Cloud', /googledomains\.com$|google\.com$/],
  ['WP Engine', /wpengine\.com$/],
  ['Vercel', /vercel-dns\.com$/],
  ['Netlify', /nsone\.net$/],
  ['WordPress.com', /wordpress\.com$/],
];

export function dnsHostOf(ns: string[] | null): string {
  if (!ns || ns.length === 0) return '';
  const hosts = ns.map((record) => record.toLowerCase().replace(/\.$/, ''));
  for (const [name, pattern] of DNS_HOSTS) if (hosts.some((host) => pattern.test(host))) return name;
  // Unknown: show the name servers' own domain, which is usually the provider.
  return clean(registrable(hosts[0]), 80);
}

const TWO_PART = /\.(?:com|net|org|edu|gov|asn|id|co|ac|govt|school|geek|gen|ltd|plc|me)\.[a-z]{2}$/i;

/** `www.shop.example.com.au` becomes `example.com.au`. A simple rule, good for the common endings. */
export function registrable(host: string): string {
  const labels = host.toLowerCase().replace(/\.$/, '').split('.');
  return labels.slice(TWO_PART.test(host) ? -3 : -2).join('.');
}

export const hostOf = (address: string): string => {
  try {
    return new URL(address).hostname.toLowerCase();
  } catch {
    return '';
  }
};

export const sameSite = (a: string, b: string): boolean => registrable(a) === registrable(b);

// ---------------------------------------------------------------------------------------------
// Size

/** Pages found by counting the home page's links to the same site. */
export function countLinks(home: Fetched): number {
  const host = hostOf(home.url);
  const paths = new Set<string>(['/']);
  for (const link of links(home.text, home.url)) {
    if (!sameSite(link.url.hostname, host)) continue;
    if (/\.(?:jpe?g|png|gif|webp|svg|pdf|zip|docx?|xlsx?|mp4|mp3|css|js|ico)$/i.test(link.url.pathname)) continue;
    paths.add(link.url.pathname.replace(/\/+$/, '') || '/');
  }
  return paths.size;
}

export const sitemapUrls = (xml: string): number => (xml.match(/<url[\s>]/gi) ?? []).length;

export const sitemapChildren = (xml: string): string[] =>
  /<sitemapindex[\s>]/i.test(xml) ? [...xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/gi)].map((m) => m[1].replace(/&amp;/g, '&')).slice(0, 200) : [];

/** Pages on the home page that are worth a second request: where a shop or the business details live. */
export function pagesToRead(home: Fetched): { shop: string[]; about: string[] } {
  const host = hostOf(home.url);
  const own = links(home.text, home.url).filter((link) => link.url.hostname.toLowerCase() === host);
  const pick = (pattern: RegExp, max: number): string[] => unique(own.filter((link: Link) => pattern.test(link.url.pathname)).map((link) => link.url.origin + link.url.pathname)).slice(0, max);
  return {
    shop: pick(/^\/(?:shop|cart|checkout|products?|store|collections)(?:\/|$)/i, 3),
    about: pick(/\/(?:about|contact)[^/]*\/?$/i, 2),
  };
}

// ---------------------------------------------------------------------------------------------
// Fit

export const LARGE_SITE = 300;

/**
 * Is this a site we can rebuild from the standard offer? `no` means it needs a conversation first.
 * A site we couldn't read is `unsure`, not `no`: a person looks at it instead.
 */
export function decideFit(result: ScanResult): { fit: Fit; reasons: string[] } {
  const no: string[] = [];
  const unsure: string[] = [];
  if (result.shop === 'yes') no.push('shop');
  if (result.members) no.push('members');
  if (result.pages !== null && result.pages > LARGE_SITE) (result.pages_method === 'sitemap' ? no : unsure).push('large');
  if (!result.reachable) unsure.push('unreadable');
  if (result.shop === 'links_out') unsure.push('shop_elsewhere');
  if (result.reachable && !result.platform && (result.pages ?? 0) < 3) unsure.push('thin');
  if (no.length) return { fit: 'no', reasons: no };
  return unsure.length ? { fit: 'unsure', reasons: unsure } : { fit: 'yes', reasons: [] };
}
