// Works out what a visit to /{product}/{number} should show: the link sign-in, then the job.
import type { AstroCookies } from 'astro';
import { callJob, type Job } from './backend.ts';
import { isCode, isProduct, parseNumber } from './job-number.ts';
import { decrypt, encrypt, randomId, sameSecret, sha256 } from './secret.ts';
import { SESSION_DAYS, addJob, addSession, countTry, getJob, refreshJob, sessionNumber, touchJob, triesSoFar } from './store.ts';

export const SESSION_COOKIE = 'mrk_build';

export type Visit =
  | { show: 'wrong' } // the link isn't right (and anything else we won't explain)
  | { show: 'busy' } // a first visit while mrkdevelopment.net can't be reached
  | { show: 'slow' } // too many wrong links from one place: wait a few minutes
  | { show: 'redirect'; to: string }
  | { show: 'job'; job: Job };

/** The job this browser is signed in to, if any. */
export async function signedInNumber(env: Env, cookies: AstroCookies): Promise<string | null> {
  const cookie = cookies.get(SESSION_COOKIE)?.value;
  return cookie ? sessionNumber(env.DB, await sha256(cookie)) : null;
}

/** Wrong links allowed from one place in ten minutes before every link from there is refused for a while. */
export const MAX_WRONG_LINKS = 10;

export async function openJob(env: Env, cookies: AstroCookies, url: URL, params: { product?: string; number?: string }, from = ''): Promise<Visit> {
  const number = parseNumber(params.number);
  const product = params.product ?? '';
  if (!number || !isProduct(product)) return { show: 'wrong' };

  const code = url.searchParams.get('k');
  if (code !== null) return signIn(env, cookies, product, number, code, from);

  if ((await signedInNumber(env, cookies)) !== number) return { show: 'wrong' };
  let row = await getJob(env.DB, number);
  if (!row || row.product !== product) return { show: 'wrong' };

  // Our copy is refreshed when it is more than a minute old. If mrkdevelopment.net is slow or
  // down, the client still gets the copy we have.
  if (Date.now() - Date.parse(row.fetched_at) > 60_000) {
    const answer = await callJob(env, 'GET', number, await decrypt(row.code_enc, env.SESSION_SECRET), { timeoutMs: 4000 });
    if (answer.job) await refreshJob(env.DB, answer.job);
    else await touchJob(env.DB, number);
    row = (await getJob(env.DB, number)) ?? row;
  }
  return { show: 'job', job: JSON.parse(row.data) as Job };
}

/** The emailed link: check the code, start a session, and send them on without the code in the address. */
async function signIn(env: Env, cookies: AstroCookies, product: string, number: string, code: string, from: string): Promise<Visit> {
  // Where the visit came from, scrambled so it can be counted but never read back.
  const place = from ? (await sha256(`${from}|${env.SESSION_SECRET}`)).slice(0, 32) : '';
  if (place && (await triesSoFar(env.DB, place)) >= MAX_WRONG_LINKS) return { show: 'slow' };
  const wrong = async (): Promise<Visit> => {
    if (place) await countTry(env.DB, place);
    return { show: 'wrong' };
  };
  if (!isCode(code)) return wrong();

  const row = await getJob(env.DB, number);
  if (row) {
    // A job we already hold is checked against our own copy of its code, so the link keeps
    // working when mrkdevelopment.net is down.
    const known = await decrypt(row.code_enc, env.SESSION_SECRET);
    if (!(await sameSecret(known, code)) || row.product !== product) return wrong();
  } else {
    const answer = await callJob(env, 'GET', number, code);
    if (answer.status === 404) return wrong();
    if (!answer.job) return { show: 'busy' };
    if (answer.job.product !== product || answer.job.number !== number) return { show: 'wrong' };
    await addJob(env.DB, answer.job, await encrypt(code, env.SESSION_SECRET));
  }

  const id = randomId();
  await addSession(env.DB, await sha256(id), number);
  cookies.set(SESSION_COOKIE, id, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: SESSION_DAYS * 86_400 });
  return { show: 'redirect', to: `/${product}/${number}` };
}
