import assert from 'node:assert/strict';
import { test } from 'node:test';
import { businessOf, changeLine, checkMissed, correctionsOf, googleLink, linesFrom, newDraft, removeLine, screenFor, tidyLong, validAbn } from '../src/lib/business.ts';
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
