// The buttons on "Your five designs". Likes, dislikes and notes are saved here as the client goes.
// Three steps follow one another: choosing, a review of what was liked (and its order), then five
// questions (five for costing, one about going over the design with Matt). Nothing is queued for mrkdevelopment.net until "Send my choices" is pressed
// on that last step, and sending finishes this part of the job.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { tidyLong } from '../../../lib/business.ts';
import { checkRanking, designsOf, moveInRank, rankOrder, rankingOf, readRanking, tidyPicks, type RankingDraft } from '../../../lib/designs.ts';
import { QUESTIONS, WHEN, WHERE, checkNeeds, needsOf, tidyNeeds } from '../../../lib/needs.ts';
import { signedInNumber } from '../../../lib/open-job.ts';
import { drain } from '../../../lib/outbox.ts';
import { getDraft, getJob, recordAction, saveDraft } from '../../../lib/store.ts';

export const POST: APIRoute = async ({ cookies, locals, redirect, request }) => {
  const number = await signedInNumber(env, cookies);
  const row = number ? await getJob(env.DB, number) : null;
  if (!row) return new Response('Please open the link in your email again.', { status: 403 });

  const form = await request.formData().catch(() => null);
  const what = String(form?.get('do') ?? '');
  const home = `/${row.product}/${row.number}`;

  if (form && row.stage === 'designs_ready') {
    const designs = designsOf((JSON.parse(row.data) as { designs?: unknown }).designs, env.BUILD_API_URL ?? '');
    // The choices live beside the "Your business" answers, in the same saved record.
    const saved = (await getDraft<{ ranking?: RankingDraft }>(env.DB, row.number)) ?? {};
    const ranking: RankingDraft = readRanking(saved.ranking);
    const save = (): Promise<unknown> => saveDraft(env.DB, row.number, { ...saved, ranking });

    // Whatever this form carried is kept first: choices, the two notes on each design, the overall note.
    const picks: Record<string, string> = {};
    for (const design of designs) {
      const key = String(design.position);
      picks[key] = String(form.get(`pick:${key}`) ?? ranking.picks[key] ?? '');
      if (form.has(`likes:${key}`)) ranking.likes[key] = tidyLong(form.get(`likes:${key}`), 1000);
      if (form.has(`dislikes:${key}`)) ranking.dislikes[key] = tidyLong(form.get(`dislikes:${key}`), 1000);
    }
    ranking.picks = tidyPicks(picks, designs);
    if (form.has('notes')) ranking.notes = tidyLong(form.get('notes'), 2000);
    // The costing questions: each answer arrives as `need:<question>`.
    const answers: Record<string, unknown> = { ...ranking.needs };
    for (const key of [...QUESTIONS.map((question) => question.key), WHERE, WHEN]) {
      if (form.has(`need:${key}`)) answers[key] = form.get(`need:${key}`);
    }
    ranking.needs = tidyNeeds(answers);
    ranking.error = '';

    // The order of preference. The review screen sends its rows in the order they stand; otherwise
    // the saved order is kept. Either way it is squared with what is liked now.
    const asked = form.getAll('rank').map((value) => Number(value));
    ranking.rank = rankOrder(asked.length > 0 ? asked : ranking.rank, ranking.picks, designs);

    // An arrow beside a design on the review screen (when there is no script to move it in place).
    const move = String(form.get('move') ?? '').match(/^(up|down):(\d)$/);
    if (ranking.sent_at === '' && move) {
      ranking.rank = moveInRank(ranking.rank, Number(move[2]), move[1] === 'up' ? -1 : 1);
      await save();
      return redirect(home, 303);
    }

    // "Change" beside one design on the review screen: back to choosing, with that design open.
    const backTo = Number(form.get('back_to'));
    if (ranking.sent_at === '' && designs.some((design) => design.position === backTo)) {
      ranking.step = 'pick';
      await save();
      return redirect(`${home}#design-${backTo}`, 303);
    }

    if (ranking.sent_at !== '') {
      // Already sent: this part of the job is finished.
    } else if (what === 'back') {
      ranking.step = ranking.step === 'needs' ? 'review' : 'pick';
    } else if (what === 'review' || what === 'next' || what === 'send') {
      ranking.error = checkRanking(ranking.picks, designs);
      if (ranking.error) {
        ranking.step = 'pick';
      } else if (what === 'review' || ranking.step === 'pick') {
        ranking.step = 'review';
      } else if (what === 'next' || ranking.step === 'review') {
        ranking.step = 'needs';
      } else {
        // Sending only ever happens from the last step, with every question answered.
        ranking.error = checkNeeds(ranking.needs);
        if (!ranking.error) {
          ranking.sent_at = new Date().toISOString();
          const body = { ranking: rankingOf(ranking, designs, ranking.sent_at), needs: needsOf(ranking.needs) };
          await save();
          // This finishes the designs step: here the job moves on to "working out your costing".
          await recordAction(env.DB, row, 'ranking', body, 'ranked', body);
          locals.cfContext.waitUntil(drain(env, row.number));
          return redirect(home, 303);
        }
      }
    }
    await save();
  }

  if (what === 'keep') return new Response(null, { status: 204 });
  return redirect(home, 303);
};
