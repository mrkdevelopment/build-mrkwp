import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QUESTIONS, checkNeeds, followUpOf, needsOf, tidyNeeds } from '../src/lib/needs.ts';
import { checkRanking, designsOf, designsScreen, moveInRank, newRanking, rankOrder, rankingOf, readRanking, tidyPicks } from '../src/lib/designs.ts';

const HOME = 'https://mrkdevelopment.net/wp-json/mrkwp/v1/build';
const pic = (name: string) => ({ url: `https://mrkdevelopment.net/wp-content/uploads/2026/11/${name}.webp`, width: 1440, height: 2200 });
const five = () => [1, 2, 3, 4, 5].map((n) => ({ position: n, name: `Design ${n}`, idea: 'An idea.', notes: '', desktop: pic(`rb-1002-design-${n}-desktop`), mobile: pic(`rb-1002-design-${n}-mobile`) }));

test('designs are read off the job, in order', () => {
  const designs = designsOf([...five()].reverse(), HOME);
  assert.deepEqual(designs.map((d) => d.position), [1, 2, 3, 4, 5]);
  assert.equal(designs[0].desktop?.url, 'https://mrkdevelopment.net/wp-content/uploads/2026/11/rb-1002-design-1-desktop.webp');
  assert.equal(designsOf([], HOME).length, 0);
  assert.equal(designsOf('nonsense', HOME).length, 0);
});

test('a picture is only shown from mrkdevelopment.net', () => {
  const odd = five();
  odd[0].desktop.url = 'https://evil.example/x.webp';
  odd[1].desktop.url = 'javascript:alert(1)';
  odd[2].desktop.url = 'http://mrkdevelopment.net/x.webp'; // not https
  odd[3].desktop.url = 'https://media.mrkdevelopment.net/x.webp'; // a sub-domain is fine
  odd[4].desktop.url = 'https://notmrkdevelopment.net/x.webp';
  const designs = designsOf(odd, HOME);
  assert.deepEqual(designs.map((d) => d.desktop !== null), [false, false, false, true, false]);
  assert.ok(designs.every((d) => d.mobile !== null));
  assert.equal(designsOf([{ position: 1, name: '<b>Bold</b>', desktop: pic('a'), mobile: pic('b') }], HOME)[0].name, '<b>Bold</b>'); // kept as text; the page escapes it
});

test('choices need at least one Like', () => {
  const designs = designsOf(five(), HOME);
  assert.match(checkRanking({}, designs), /Like at least one/);
  assert.match(checkRanking({ 1: 'dislike', 2: 'dislike' }, designs), /Like at least one/);
  assert.equal(checkRanking({ 3: 'like' }, designs), '');
  assert.deepEqual(tidyPicks({ 1: 'like', 2: 'dislike', 3: '<x>', 4: '1', 7: 'like' }, designs), { 1: 'like', 2: 'dislike', 3: '', 4: '', 5: '' });
});

test('choices are sent with both notes on each design', () => {
  const designs = designsOf(five(), HOME);
  const draft = {
    ...newRanking(),
    picks: { 1: 'like', 2: 'dislike', 3: 'like', 4: '', 5: '' },
    likes: { 1: 'The colours.', 4: 'Nice photo.' },
    dislikes: { 1: 'The headline is too big.', 2: 'Too loud for us.' },
    notes: 'Colours of 1, layout of 3.',
  };
  assert.deepEqual(rankingOf(draft, designs, '2026-11-28T04:00:00.000Z'), {
    order: [1, 3],
    rejected: [2],
    feedback: [
      { position: 1, choice: 'like', likes: 'The colours.', dislikes: 'The headline is too big.' }, // a liked design can still have dislikes
      { position: 2, choice: 'dislike', likes: '', dislikes: 'Too loud for us.' },
      { position: 3, choice: 'like', likes: '', dislikes: '' },
      { position: 4, choice: '', likes: 'Nice photo.', dislikes: '' }, // notes without a choice are still sent
    ],
    notes: 'Colours of 1, layout of 3.',
    ranked_at: '2026-11-28T04:00:00.000Z',
  });
});

test('choices saved before there were two notes still open', () => {
  const old = readRanking({ picks: { 1: 'like' }, comments: { 1: 'The colours.' }, notes: 'x', step: 'review' });
  assert.deepEqual(old.likes, { 1: 'The colours.' });
  assert.deepEqual(old.dislikes, {});
  assert.equal(old.step, 'review');
  assert.deepEqual(readRanking(undefined), newRanking());
});

test('choosing, then a review, then the questions, then sent', () => {
  assert.equal(designsScreen(newRanking()), 'pick');
  assert.equal(designsScreen({ ...newRanking(), step: 'review' }), 'review');
  assert.equal(designsScreen({ ...newRanking(), step: 'needs' }), 'needs');
  // Once sent, the thank-you screen shows whatever step was left behind.
  assert.equal(designsScreen({ ...newRanking(), step: 'needs', sent_at: '2026-11-28T04:00:00.000Z' }), 'sent');
});

test('the liked designs keep an order of preference', () => {
  const designs = designsOf(five(), HOME);
  const picks = { 1: 'dislike', 2: 'like', 4: 'like', 5: 'like' };
  // Nothing chosen yet: design order.
  assert.deepEqual(rankOrder([], picks, designs), [2, 4, 5]);
  // The order asked for is kept; a design no longer liked drops out; a newly liked one joins the end.
  assert.deepEqual(rankOrder([5, 1, 2, 5], picks, designs), [5, 2, 4]);
  assert.deepEqual(rankOrder([4, 9, 3], picks, designs), [4, 2, 5]);
  // Moving up and down, and staying put at either end.
  assert.deepEqual(moveInRank([5, 2, 4], 4, -1), [5, 4, 2]);
  assert.deepEqual(moveInRank([5, 2, 4], 5, 1), [2, 5, 4]);
  assert.deepEqual(moveInRank([5, 2, 4], 5, -1), [5, 2, 4]);
  assert.deepEqual(moveInRank([5, 2, 4], 4, 1), [5, 2, 4]);
  assert.deepEqual(moveInRank([5, 2, 4], 3, 1), [5, 2, 4]);
});

test('the liked designs are sent first choice first', () => {
  const designs = designsOf(five(), HOME);
  const sent = rankingOf({ ...newRanking(), picks: { 2: 'like', 4: 'like', 5: 'like', 1: 'dislike' }, rank: [5, 2, 4] }, designs, '2026-11-28T04:00:00.000Z');
  assert.deepEqual(sent.order, [5, 2, 4]);
  assert.deepEqual(sent.rejected, [1]);
  assert.deepEqual(readRanking({ rank: [5, 'x', 2] }).rank, [5, 2]);
});

test('the questions before sending', () => {
  assert.deepEqual(QUESTIONS.map((question) => question.key), ['forms', 'enquiries', 'editing', 'support', 'technical', 'followup']);
  // Every costing question can be answered "I'm not sure".
  for (const question of QUESTIONS.slice(0, 5)) assert.ok(question.options.some((option) => option.value === 'unsure'), question.key);

  assert.match(checkNeeds({}), /6 questions/);
  const five = { forms: 'work', enquiries: 'crm', enquiries_where: 'HubSpot', editing: 'self_trained', support: 'unsure', technical: 'help' };
  assert.equal(checkNeeds(five), 'One question still needs an answer.'); // the one left has no "I'm not sure"
  assert.match(checkNeeds({ ...five, support: '', followup: 'none' }), /One question still needs an answer\. "I'm not sure" is fine\./);
  const all = { ...five, followup: 'call', followup_when: 'Weekday mornings' };
  assert.equal(checkNeeds(all), '');

  // Only the listed answers are kept; anything else typed into the form is dropped.
  assert.deepEqual(tidyNeeds({ forms: 'work', enquiries: '<script>', support: 'maybe', technical: 'help', followup: 'fax', enquiries_where: '  Our   booking system ', extra: 'x' }), {
    forms: 'work',
    technical: 'help',
    enquiries_where: 'Our booking system',
  });

  // Each piece of text is only sent when its answer applies.
  assert.deepEqual(needsOf(all), all);
  assert.equal(needsOf({ ...all, enquiries: 'email' }).enquiries_where, '');
  assert.equal(needsOf({ ...all, followup: 'meet' }).followup_when, '');
});

test('what a client is shown after sending depends on how they want to go over the design', () => {
  assert.deepEqual(followUpOf({ followup: 'meet', followup_when: 'ignored' }), { choice: 'meet', when: '' });
  assert.deepEqual(followUpOf({ followup: 'call', followup_when: 'Weekday mornings' }), { choice: 'call', when: 'Weekday mornings' });
  assert.deepEqual(followUpOf({ followup: 'none' }), { choice: 'none', when: '' });
  assert.deepEqual(followUpOf({}), { choice: 'none', when: '' });
});
