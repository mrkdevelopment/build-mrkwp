// "Your business": what happens when a client presses a button. Each step is saved here first;
// finished answers are queued for mrkdevelopment.net through the outbox.
import { CHECK_LOST_MS, MAX_CHECKS, businessOf, changeLine, checkMissed, correctionsOf, linesFrom, newDraft, removeLine, tidy, tidyLong, type Draft } from './business.ts';
import { drain } from './outbox.ts';
import { decideFit, emptyResult, type ScanResult } from './scan/checks.ts';
import { normaliseAddress } from './scan/fetch.ts';
import { runScan } from './scan/run.ts';
import { countRuns, finishRun, getDraft, getJob, latestRun, recordAction, saveDraft, startRun, type JobRow } from './store.ts';

type Later = (work: Promise<unknown>) => void;

export async function draftFor(env: Env, row: JobRow): Promise<Draft> {
  const saved = await getDraft<Draft>(env.DB, row.number);
  if (saved) return { ...newDraft(), ...saved };
  // First visit: start with the address they gave when they signed up, if they gave one.
  const website = (JSON.parse(row.data) as { website?: unknown }).website;
  return newDraft(typeof website === 'string' ? website : '');
}

/** "Check my site": start a check and come straight back. The check itself runs after the answer is sent. */
export async function startCheck(env: Env, row: JobRow, raw: unknown, later: Later): Promise<void> {
  const draft = await draftFor(env, row);
  if (draft.step !== 'address') return;
  const typed = tidy(raw, 300);
  const address = normaliseAddress(typed);
  draft.address = typed;
  if (!address) {
    draft.note = 'invalid';
    await saveDraft(env.DB, row.number, draft);
    return;
  }

  const running = await latestRun(env.DB, row.number);
  if (running && !running.finished_at && Date.now() - Date.parse(running.started_at) < CHECK_LOST_MS) return;

  draft.note = '';
  if ((await countRuns(env.DB, row.number)) >= MAX_CHECKS) {
    // Enough tries. Carry on, and a person looks at the site instead.
    const result = { ...emptyResult(address), reason: 'limit' as const, fit: 'unsure' as const, fit_reasons: ['unreadable'] };
    const id = await startRun(env.DB, row.number, address);
    await finishRun(env.DB, id, result);
    draft.lines = linesFrom(result);
    draft.step = 'found';
    await saveDraft(env.DB, row.number, draft);
    return;
  }

  await saveDraft(env.DB, row.number, draft);
  const id = await startRun(env.DB, row.number, address);
  later(finishCheck(env, row.number, id, address));
}

async function unreadableBefore(env: Env, number: string, exceptId: number): Promise<number> {
  const rows = await env.DB.prepare('SELECT result FROM scan_runs WHERE number = ? AND id != ? AND result IS NOT NULL').bind(number, exceptId).all<{ result: string }>();
  return rows.results.filter((r) => (JSON.parse(r.result) as ScanResult).reachable === false).length;
}

/** Run the check and settle what the client sees next. */
export async function finishCheck(env: Env, number: string, runId: number, address: string): Promise<void> {
  let result: ScanResult;
  try {
    result = await runScan(address);
  } catch {
    result = { ...emptyResult(address), reason: 'error' };
    const fit = decideFit(result);
    result.fit = fit.fit;
    result.fit_reasons = fit.reasons;
  }
  await finishRun(env.DB, runId, result);

  const row = await getJob(env.DB, number);
  if (!row || row.stage !== 'confirmed') return;
  const draft = await draftFor(env, row);
  if (draft.step !== 'address') return;

  // A site we couldn't read gets one more try, in case the address was mistyped. After that we
  // carry on and a person looks at it: a site that blocks automatic visits is not a bad site.
  if (!result.reachable && (await unreadableBefore(env, number, runId)) === 0) {
    draft.note = result.reason || 'error';
    await saveDraft(env.DB, number, draft);
    return;
  }

  if (result.fit === 'no') {
    await saveDraft(env.DB, number, draft);
    const business = { website: result.final_url || address };
    await recordAction(env.DB, row, 'details', { business, scan: result }, 'not_a_fit', { business, scan: result });
    await drain(env, number);
    return;
  }

  draft.note = '';
  draft.lines = linesFrom(result);
  draft.step = 'found';
  await saveDraft(env.DB, number, draft);
}

async function lastResult(env: Env, number: string): Promise<ScanResult | null> {
  const run = await latestRun(env.DB, number);
  return run?.result ? (JSON.parse(run.result) as ScanResult) : null;
}

/** Looks a typed ABN up on the Australian Business Register. Only runs when Matt has added the key. */
async function lookUpAbn(env: Env, abn: string): Promise<{ status: string; name: string } | null> {
  if (!env.ABN_LOOKUP_GUID) return null;
  try {
    const response = await fetch(`https://abr.business.gov.au/json/AbnDetails.aspx?abn=${abn}&callback=c&guid=${encodeURIComponent(env.ABN_LOOKUP_GUID)}`, { signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    const data = JSON.parse(text.replace(/^[^(]*\(/, '').replace(/\)\s*;?\s*$/, '')) as { AbnStatus?: string; EntityName?: string; Message?: string };
    if (!data.AbnStatus) return null;
    return { status: tidy(data.AbnStatus, 40), name: tidy(data.EntityName, 120) };
  } catch {
    return null;
  }
}

/** Keeps what has been typed so far on "Anything we missed?" and "What you want", without judging it. */
export function keepTyped(draft: Draft, form: FormData): void {
  if (form.has('abn')) draft.abn = tidy(form.get('abn'), 20);
  if (form.has('google')) draft.google = tidy(form.get('google'), 500);
  for (const [name, value] of form) {
    if (name.startsWith('social:')) draft.added[name.slice(7)] = tidy(value, 300);
  }
  if (form.has('goals')) draft.goals = tidyLong(form.get('goals'));
}

/** Every button on the "Your business" screens. Returns nothing: the page is shown again from what was saved. */
export async function businessAction(env: Env, row: JobRow, form: FormData, later: Later): Promise<void> {
  const what = String(form.get('do') ?? '');
  if (what === 'check') return startCheck(env, row, form.get('address'), later);

  const draft = await draftFor(env, row);
  draft.error = '';

  if (what === 'keep') {
    keepTyped(draft, form);
  } else if (what === 'restart' && (draft.step === 'found' || draft.step === 'missed')) {
    draft.step = 'address';
    draft.note = '';
    draft.lines = [];
  } else if (draft.step === 'found') {
    const key = String(form.get('key') ?? '');
    if (what === 'change') draft.error = changeLine(draft, key, form.get('value'));
    if (what === 'remove') removeLine(draft, key, true);
    if (what === 'restore') removeLine(draft, key, false);
    if (what === 'found_ok') draft.step = 'missed';
  } else if (draft.step === 'missed' && what === 'missed') {
    keepTyped(draft, form);
    draft.error = checkMissed(draft);
    if (!draft.error) {
      const result = (await lastResult(env, row.number)) ?? emptyResult(draft.address);
      const abn = draft.abn.replace(/\s/g, '');
      const found = abn ? await lookUpAbn(env, abn) : null;
      draft.abn_name = found?.name ?? '';
      draft.abn_status = found?.status ?? '';
      if (found && found.status.toLowerCase() !== 'active' && result.fit !== 'no') {
        result.fit = 'unsure';
        result.fit_reasons = [...new Set([...result.fit_reasons, 'abn_not_active'])];
      }
      const business = businessOf(draft, result.final_url || normaliseAddress(draft.address) || draft.address);
      const scan = { ...result, client_corrections: correctionsOf(draft.lines) };
      draft.step = 'wants';
      await saveDraft(env.DB, row.number, draft);
      await recordAction(env.DB, row, 'details', { business, scan }, 'confirmed', { business, scan });
      later(drain(env, row.number));
      return;
    }
  } else if (draft.step === 'wants' && what === 'wants') {
    keepTyped(draft, form);
    await saveDraft(env.DB, row.number, draft);
    await recordAction(env.DB, row, 'goals', { goals: draft.goals }, 'ready', { goals: draft.goals });
    later(drain(env, row.number));
    return;
  }
  await saveDraft(env.DB, row.number, draft);
}
