import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isOverdue, retryDelay } from '../src/lib/backoff.ts';
import { isCode, isProduct, parseNumber } from '../src/lib/job-number.ts';
import { decrypt, encrypt, randomId, sameSecret } from '../src/lib/secret.ts';
import { STAGES } from '../src/products/rebuild/stages.ts';

test('job numbers', () => {
  assert.equal(parseNumber('rb-1001'), 'RB-1001');
  assert.equal(parseNumber('RB-12345'), 'RB-12345');
  for (const bad of ['RB-101', 'R-1001', 'RB1001', 'RB-1001/x', '', undefined]) assert.equal(parseNumber(bad), null);
  assert.ok(isProduct('rebuild'));
  assert.ok(!isProduct('card'));
});

test('private codes', () => {
  assert.ok(isCode(randomId()));
  assert.ok(!isCode('short'));
  assert.ok(!isCode('a'.repeat(42) + '!'));
  assert.ok(!isCode(null));
});

test('a code survives being stored, and the wrong key cannot read it', async () => {
  const code = randomId();
  const sealed = await encrypt(code, 'one secret');
  assert.ok(!sealed.includes(code));
  assert.equal(await decrypt(sealed, 'one secret'), code);
  await assert.rejects(decrypt(sealed, 'another secret'));
  assert.ok(await sameSecret(code, code));
  assert.ok(!(await sameSecret(code, randomId())));
});

test('outbox waits longer each time, up to an hour', () => {
  assert.deepEqual([1, 2, 3, 4, 7, 20].map((n) => retryDelay(n) / 60_000), [1, 2, 4, 8, 60, 60]);
  const now = Date.parse('2026-11-28T12:00:00Z');
  assert.ok(isOverdue('2026-11-27T11:00:00Z', now));
  assert.ok(!isOverdue('2026-11-27T13:00:00Z', now));
});

test('every stage the backend knows has a screen', () => {
  const stages = 'signed_up confirmed not_a_fit ready claimed designing designs_received designs_ready ranked priced paid building demo_ready changes_requested approved live closed';
  for (const stage of stages.split(' ')) assert.ok(STAGES[stage], stage);
});
