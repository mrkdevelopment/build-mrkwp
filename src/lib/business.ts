// "Your business": the rules for which screen a client is on and what their answers look like.
// Nothing here touches the database or the network, so it can all be tested directly.
import { socialOf, type ScanResult, type Social } from './scan/checks.ts';

export type Step = 'address' | 'found' | 'missed' | 'wants';
export type Screen = Step | 'checking';

/** One thing the check found, as the client sees it and may correct it. */
export interface Line {
  key: string;
  label: string;
  value: string;
  /** What the check found, kept so a correction can be seen for what it is. */
  original: string;
  kind: 'text' | 'logo' | 'colour' | 'link';
  /** `builders` lines are the technical ones, folded away by default. */
  group: 'main' | 'builders';
  editable: boolean;
  removed: boolean;
}

export interface Draft {
  step: Step;
  /** The address last typed, so it is still there when they come back. */
  address: string;
  /** Why the last check couldn't read the site, shown on the address screen. */
  note: string;
  lines: Line[];
  abn: string;
  abn_name: string;
  abn_status: string;
  google: string;
  /** Social profiles typed by the client, by network. */
  added: Record<string, string>;
  goals: string;
  /** A message about the last thing they submitted, shown once on the screen it belongs to. */
  error: string;
}

export const newDraft = (address = ''): Draft => ({
  step: 'address', address, note: '', lines: [], abn: '', abn_name: '', abn_status: '', google: '', added: {}, goals: '', error: '',
});

/** Networks we ask about on "Anything we missed?" when the check didn't find them. */
export const ASKED_NETWORKS = ['Facebook', 'Instagram', 'LinkedIn'];

/** A check still running after this long has been lost, and the client may start another. */
export const CHECK_LOST_MS = 45_000;
/** How many times one job may check an address, so this can't be used to probe other sites. */
export const MAX_CHECKS = 6;

export function screenFor(draft: Draft, run: { started_at: string; finished_at: string | null } | null, now: number): Screen {
  if (draft.step !== 'address') return draft.step;
  if (run && !run.finished_at && now - Date.parse(run.started_at) < CHECK_LOST_MS) return 'checking';
  return 'address';
}

const TOOL_KINDS: Record<string, string> = {
  crm: 'Email marketing', booking: 'Bookings', chat: 'Live chat', payments: 'Payments', maps: 'Map', analytics: 'Visitor statistics',
  ads: 'Advertising', video: 'Video', forms: 'Forms', reviews: 'Reviews', widgets: 'Widgets',
};

/** The list shown on "Here's what we found", built from a finished check. */
export function linesFrom(result: ScanResult): Line[] {
  const lines: Line[] = [];
  const add = (key: string, label: string, value: string, kind: Line['kind'], group: Line['group'], editable: boolean): void => {
    if (value) lines.push({ key, label, value, original: value, kind, group, editable, removed: false });
  };
  // The business name is always listed, so it can be typed in when the check didn't find one.
  lines.push({ key: 'name', label: 'Business name', value: result.business.name, original: result.business.name, kind: 'text', group: 'main', editable: true, removed: false });
  add('logo', 'Logo', result.branding.logo, 'logo', 'main', false);
  add('colour', 'Main colour', result.branding.theme_color, 'colour', 'main', false);
  add('phone', 'Phone', result.business.phone, 'text', 'main', true);
  add('address', 'Address', result.business.address, 'text', 'main', true);
  for (const social of result.socials) add(`social:${social.network}`, social.network, social.url, 'link', 'main', true);
  if (result.pages !== null && result.pages > 0) {
    add('pages', 'Pages on your site', result.pages_method === 'sitemap' ? String(result.pages) : `About ${result.pages}`, 'text', 'main', false);
  }

  add('platform', 'Built with', result.platform, 'text', 'builders', false);
  add('email', 'Email is with', result.email_provider, 'text', 'builders', false);
  add('dns', 'Domain is managed at', result.dns_host, 'text', 'builders', false);
  add('registrar', 'Domain is registered with', result.registrar, 'text', 'builders', false);
  if (result.branding.fonts.length) add('fonts', 'Fonts', result.branding.fonts.join(', '), 'text', 'builders', false);
  for (const tool of result.tools) add(`tool:${tool.name}`, TOOL_KINDS[tool.kind] ?? 'Tool', tool.name, 'text', 'builders', false);
  return lines;
}

/** One line of text a client typed: trimmed, on one line, not too long. */
export const tidy = (value: unknown, max = 200): string =>
  (typeof value === 'string' ? value : '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

/** Free text over several lines (the "what you want" box). */
export const tidyLong = (value: unknown, max = 5000): string =>
  (typeof value === 'string' ? value : '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim().slice(0, max);

/** Change one line. Returns a message when the new value can't be used. */
export function changeLine(draft: Draft, key: string, raw: unknown): string {
  const line = draft.lines.find((l) => l.key === key);
  if (!line || !line.editable) return '';
  const value = tidy(raw);
  if (line.kind === 'link') {
    const social = socialOf(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    if (!social || social.network !== line.label) return `That doesn't look like a ${line.label} page. Paste the address of your page, or remove the line.`;
    line.value = social.url;
  } else {
    line.value = value;
  }
  line.removed = false;
  return '';
}

export function removeLine(draft: Draft, key: string, removed: boolean): void {
  const line = draft.lines.find((l) => l.key === key);
  // The business name can be changed but not removed: every job needs one.
  if (line && line.key !== 'name') line.removed = removed;
}

/** What the client changed or removed, so a person can see it. Removed tools still count until someone checks. */
export function correctionsOf(lines: Line[]): { key: string; found: string; now: string | null }[] {
  return lines.filter((line) => line.removed || line.value !== line.original).map((line) => ({ key: line.key, found: line.original, now: line.removed ? null : line.value }));
}

/** An ABN is 11 digits that pass the Tax Office's check sum. */
export function validAbn(abn: string): boolean {
  if (!/^\d{11}$/.test(abn)) return false;
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  const sum = [...abn].reduce((total, digit, i) => total + (Number(digit) - (i === 0 ? 1 : 0)) * weights[i], 0);
  return sum % 89 === 0;
}

/** A Google Business Profile or Google Maps link, or '' when it isn't one. */
export function googleLink(raw: string): string {
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
    const ok = /(?:^|\.)google\.[a-z.]{2,6}$|(?:^|\.)g\.page$|(?:^|\.)goo\.gl$|^g\.co$/i.test(url.hostname);
    return ok ? ('https://' + url.hostname.toLowerCase() + url.pathname + url.search).slice(0, 500) : '';
  } catch {
    return '';
  }
}

/** Check the "Anything we missed?" answers. Returns a message for the client, or '' when all is well. */
export function checkMissed(draft: Draft): string {
  if (draft.abn && !validAbn(draft.abn.replace(/\s/g, ''))) return "That ABN doesn't look right. An ABN has 11 digits. Check it, or leave the box empty.";
  if (draft.google && !googleLink(draft.google)) return "That doesn't look like a Google link. Paste the link to your Google Business Profile, or leave the box empty.";
  for (const [network, value] of Object.entries(draft.added)) {
    if (!value) continue;
    const social = socialOf(/^https?:\/\//i.test(value) ? value : 'https://' + value);
    if (!social || social.network !== network) return `That doesn't look like a ${network} page. Paste the address of your page, or leave the box empty.`;
  }
  return '';
}

/** The client's confirmed details, in the shape the backend's `business` part has. */
export function businessOf(draft: Draft, website: string): Record<string, unknown> {
  const kept = (key: string): string => {
    const line = draft.lines.find((l) => l.key === key);
    return line && !line.removed ? line.value : '';
  };
  const socials: Social[] = draft.lines.filter((line) => line.key.startsWith('social:') && !line.removed && line.value).map((line) => ({ network: line.label, url: line.value }));
  for (const [network, value] of Object.entries(draft.added)) {
    const social = value ? socialOf(/^https?:\/\//i.test(value) ? value : 'https://' + value) : null;
    if (social && !socials.some((s) => s.network === network)) socials.push(social);
  }
  return {
    website,
    name: kept('name'),
    phone: kept('phone'),
    address: kept('address'),
    abn: draft.abn.replace(/\s/g, ''),
    abn_name: draft.abn_name,
    google_business_url: googleLink(draft.google),
    socials,
  };
}
