import assert from 'node:assert/strict';
import { test } from 'node:test';
import { businessOf, changeLine, checkMissed, correctionsOf, goBackTo, googleLink, linesFrom, newDraft, removeLine, screenFor, stepBefore, summaryRows, tidyLong, validAbn } from '../src/lib/business.ts';
import { socialOf } from '../src/lib/scan/checks.ts';
import { emptyResult } from '../src/lib/scan/checks.ts';

const found = () => ({
  ...emptyResult('https://smith.com.au/'),
  reachable: true,
  business: { name: 'Smith Plumbing', phone: '02 6862 0000', address: '' },
  socials: [{ network: 'Facebook', url: 'https://www.facebook.com/smith' }],
  tools: [{ name: 'Calendly', kind: 'booking' }],
  pages: 12,
  pages_method: 'sitemap' as const,
  platform: 'WordPress',
});

test('which screen a client is on', () => {
  const now = Date.parse('2026-11-28T10:00:30Z');
  const draft = newDraft('smith.com.au');
  assert.equal(screenFor(draft, null, now), 'address');
  assert.equal(screenFor(draft, { started_at: '2026-11-28T10:00:20Z', finished_at: null }, now), 'checking');
  // A check that never came back doesn't trap them on the waiting screen.
  assert.equal(screenFor(draft, { started_at: '2026-11-28T09:58:00Z', finished_at: null }, now), 'address');
  assert.equal(screenFor(draft, { started_at: '2026-11-28T10:00:20Z', finished_at: '2026-11-28T10:00:25Z' }, now), 'address');
  assert.equal(screenFor({ ...draft, step: 'found' }, null, now), 'found');
});

test('what we found can be corrected, and corrections are kept for a person to see', () => {
  const draft = { ...newDraft(), lines: linesFrom(found()) };
  assert.deepEqual(draft.lines.map((line) => line.key), ['name', 'phone', 'social:Facebook', 'pages', 'platform', 'tool:Calendly']);
  assert.equal(changeLine(draft, 'name', '  Smith   Plumbing & Gas '), '');
  assert.match(changeLine(draft, 'social:Facebook', 'https://instagram.com/smith'), /Facebook/);
  assert.equal(changeLine(draft, 'social:Facebook', 'facebook.com/smithgas'), '');
  assert.equal(changeLine(draft, 'pages', '3'), ''); // not editable: ignored
  removeLine(draft, 'tool:Calendly', true);
  removeLine(draft, 'name', true); // the name can't be removed
  assert.deepEqual(correctionsOf(draft.lines), [
    { key: 'name', found: 'Smith Plumbing', now: 'Smith Plumbing & Gas' },
    { key: 'social:Facebook', found: 'https://www.facebook.com/smith', now: 'https://facebook.com/smithgas' },
    { key: 'tool:Calendly', found: 'Calendly', now: null },
  ]);
  const business = businessOf({ ...draft, abn: '51 824 753 556', added: { Instagram: 'instagram.com/smith' } }, 'https://smith.com.au/');
  assert.equal(business.name, 'Smith Plumbing & Gas');
  assert.equal(business.abn, '51824753556');
  assert.deepEqual(business.socials, [{ network: 'Facebook', url: 'https://facebook.com/smithgas' }, { network: 'Instagram', url: 'https://instagram.com/smith' }]);
});

test('the optional extras are checked kindly', () => {
  assert.ok(validAbn('51824753556'));
  assert.ok(!validAbn('51824753557'));
  assert.ok(!validAbn('123'));
  assert.equal(googleLink('maps.app.goo.gl/abc123'), 'https://maps.app.goo.gl/abc123');
  assert.equal(googleLink('https://g.page/smith'), 'https://g.page/smith');
  assert.equal(googleLink('https://notgoogle.com/maps'), '');
  assert.equal(checkMissed(newDraft()), '');
  assert.match(checkMissed({ ...newDraft(), abn: '12345678901' }), /ABN/);
  assert.match(checkMissed({ ...newDraft(), google: 'facebook.com/x' }), /Google/);
  assert.match(checkMissed({ ...newDraft(), added: { LinkedIn: 'facebook.com/x' } }), /LinkedIn/);
  assert.equal(checkMissed({ ...newDraft(), abn: '51 824 753 556', added: { LinkedIn: 'linkedin.com/company/smith' } }), '');
});

test('what a client writes stays text', () => {
  assert.equal(tidyLong('  More calls.\r\n\r\nShow prices.  '), 'More calls.\n\nShow prices.');
  assert.equal(tidyLong('x'.repeat(6000)).length, 5000);
});

test('phone and address are asked for when the check found none, and a found one wins', () => {
  const none = { ...newDraft(), lines: linesFrom({ ...found(), business: { name: 'Smith Plumbing', phone: '', address: '' } }), phone: '02 6862 1111', postal: 'Parkes NSW' };
  assert.equal(businessOf(none, 'https://smith.com.au/').phone, '02 6862 1111');
  assert.equal(businessOf(none, 'https://smith.com.au/').address, 'Parkes NSW');
  const some = { ...newDraft(), lines: linesFrom(found()), phone: 'ignored' };
  assert.equal(businessOf(some, 'https://smith.com.au/').phone, '02 6862 0000');
  // Removing the found phone means the typed one is used.
  removeLine(some, 'phone', true);
  assert.equal(businessOf(some, 'https://smith.com.au/').phone, 'ignored');
  assert.match(checkMissed({ ...newDraft(), phone: '123' }), /phone/);
});

test('back goes one step, never forward, and a new address starts the findings again', () => {
  assert.deepEqual(['summary', 'wants', 'missed', 'found', 'address'].map((step) => stepBefore(step as 'found')), ['wants', 'missed', 'found', 'address', null]);
  const draft = { ...newDraft('smith.com.au'), step: 'summary' as const, lines: linesFrom(found()), goals: 'More calls' };
  goBackTo(draft, 'summary'); // not earlier: ignored
  assert.equal(draft.step, 'summary');
  goBackTo(draft, 'missed');
  assert.equal(draft.step, 'missed');
  goBackTo(draft, 'wants'); // forward: ignored
  goBackTo(draft, 'nonsense');
  assert.equal(draft.step, 'missed');
  assert.equal(draft.goals, 'More calls');
  assert.ok(draft.lines.length > 0);
  goBackTo(draft, 'address');
  assert.equal(draft.lines.length, 0);
});

test('the summary shows what will be sent and where to change it', () => {
  const draft = { ...newDraft(), lines: linesFrom(found()), postal: 'Parkes NSW', abn: '51 824 753 556', added: { Instagram: 'https://instagram.com/smith' }, goals: '' };
  removeLine(draft, 'social:Facebook', true);
  const rows = summaryRows(draft, 'https://www.smith.com.au/');
  assert.deepEqual(rows.map((row) => [row.label, row.value, row.step]), [
    ['Website', 'smith.com.au', 'address'],
    ['Business name', 'Smith Plumbing', 'found'],
    ['Phone', '02 6862 0000', 'found'],
    ['Address', 'Parkes NSW', 'missed'],
    ['Instagram', 'instagram.com/smith', 'missed'],
    ['ABN', '51 824 753 556', 'missed'],
    ['What your new website should do better', "Nothing added. We'll work from your current site and branding.", 'wants'],
  ]);
});

test('a Facebook page without a custom name keeps the part that identifies it', () => {
  assert.deepEqual(socialOf('https://www.facebook.com/profile.php?id=100063512345678'), { network: 'Facebook', url: 'https://www.facebook.com/profile.php?id=100063512345678' });
  assert.equal(socialOf('https://www.facebook.com/profile.php'), null);
  assert.equal(socialOf('https://www.facebook.com/sharer/sharer.php?u=https://a.com'), null);
});

test('"needs a conversation" can be left by going back to the address, and nowhere else', () => {
  const draft = { ...newDraft('myshop.com.au'), step: 'not_fit' as const };
  assert.equal(screenFor(draft, null, Date.now()), 'not_fit');
  assert.equal(stepBefore('not_fit'), 'address');
  goBackTo(draft, 'found');
  goBackTo(draft, 'summary');
  assert.equal(draft.step, 'not_fit');
  goBackTo(draft, 'address');
  assert.equal(draft.step, 'address');
  assert.equal(draft.address, 'myshop.com.au'); // still in the box, ready to correct
});
