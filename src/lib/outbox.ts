// Sends what clients have entered on to mrkdevelopment.net, and keeps trying until it is accepted.
import { callJob } from './backend.ts';
import { NOT_BUILT_YET, isOverdue, retryDelay } from './backoff.ts';
import { decrypt } from './secret.ts';
import { getJob, outboxDone, outboxLater, outboxRows, refreshJob } from './store.ts';

/**
 * One pass over the outbox (or over one job's rows). A job's rows go in the order the client made
 * them: if the oldest can't be sent yet, the later ones wait behind it.
 */
export async function drain(env: Env, onlyNumber?: string): Promise<void> {
  const stuck = new Set<string>();
  const nowMs = Date.now();

  for (const row of await outboxRows(env.DB, onlyNumber)) {
    if (stuck.has(row.number)) continue;
    if (Date.parse(row.next_try_at) > nowMs) {
      stuck.add(row.number);
      continue;
    }

    const job = await getJob(env.DB, row.number);
    if (!job) {
      await outboxDone(env.DB, row.id);
      continue;
    }

    const code = await decrypt(job.code_enc, env.SESSION_SECRET);
    const answer = await callJob(env, 'PATCH', row.number, code, {
      body: { ...JSON.parse(row.body), action: row.action },
      idempotencyKey: row.idempotency_key,
    });

    if (answer.job) {
      await outboxDone(env.DB, row.id);
      await refreshJob(env.DB, answer.job);
      continue;
    }

    stuck.add(row.number);
    const later = (ms: number) => new Date(nowMs + ms).toISOString();
    if (answer.status === 400 && answer.code === NOT_BUILT_YET) {
      // The backend can't take this action yet. Not a failure: keep the row and look again in an hour.
      await outboxLater(env.DB, row.id, row.attempts, later(60 * 60_000), 'waiting for the backend to support this', false);
    } else {
      const attempts = row.attempts + 1;
      const flagged = isOverdue(row.created_at, nowMs);
      await outboxLater(env.DB, row.id, attempts, later(retryDelay(attempts)), `status ${answer.status}`, flagged);
      // Job number, action and status only: nothing that identifies a person.
      console.warn(`outbox: ${row.number} ${row.action} not accepted (status ${answer.status})${flagged ? ', failing for over a day' : ''}`);
    }
  }
}
