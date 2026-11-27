// The working copy in D1: jobs, sessions and the outbox.
import type { Job } from './backend.ts';

export interface JobRow {
  number: string;
  product: string;
  stage: string;
  data: string;
  code_enc: string;
  fetched_at: string;
  updated_at: string;
}

export interface OutboxRow {
  id: number;
  number: string;
  action: string;
  body: string;
  idempotency_key: string;
  attempts: number;
  next_try_at: string;
  last_error: string | null;
  created_at: string;
  flagged: number;
}

const now = (): string => new Date().toISOString();

export const getJob = (db: D1Database, number: string): Promise<JobRow | null> =>
  db.prepare('SELECT * FROM jobs WHERE number = ?').bind(number).first<JobRow>();

/** First time a job is seen: keep it, with its private code encrypted. */
export async function addJob(db: D1Database, job: Job, codeEnc: string): Promise<void> {
  await db
    .prepare(
      `INSERT INTO jobs (number, product, stage, data, code_enc, fetched_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT (number) DO UPDATE SET fetched_at = ?6`,
    )
    .bind(job.number, job.product, job.stage, JSON.stringify(job), codeEnc, now())
    .run();
}

/**
 * Take a fresh copy from mrkdevelopment.net. While the client has answers still waiting in the
 * outbox, their copy here is ahead of the master record, so it is left alone and only the
 * "last checked" time moves.
 */
export async function refreshJob(db: D1Database, job: Job): Promise<void> {
  await db
    .prepare(
      `UPDATE jobs SET fetched_at = ?1,
         stage = CASE WHEN waiting.n > 0 THEN stage ELSE ?2 END,
         data = CASE WHEN waiting.n > 0 THEN data ELSE ?3 END,
         updated_at = CASE WHEN waiting.n > 0 THEN updated_at ELSE ?1 END
       FROM (SELECT COUNT(*) AS n FROM outbox WHERE number = ?4) AS waiting
       WHERE jobs.number = ?4`,
    )
    .bind(now(), job.stage, JSON.stringify(job), job.number)
    .run();
}

export const touchJob = (db: D1Database, number: string): Promise<unknown> =>
  db.prepare('UPDATE jobs SET fetched_at = ? WHERE number = ?').bind(now(), number).run();

/** Something the client did: change the copy here and queue it for mrkdevelopment.net, together. */
export async function recordAction(db: D1Database, row: JobRow, action: string, body: object, newStage: string): Promise<void> {
  const data = JSON.stringify({ ...JSON.parse(row.data), stage: newStage });
  await db.batch([
    db.prepare('UPDATE jobs SET stage = ?, data = ?, updated_at = ? WHERE number = ?').bind(newStage, data, now(), row.number),
    db
      .prepare('INSERT INTO outbox (number, action, body, idempotency_key, next_try_at, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)')
      .bind(row.number, action, JSON.stringify(body), crypto.randomUUID(), now()),
  ]);
}

export const SESSION_DAYS = 30;

export async function addSession(db: D1Database, idHash: string, number: string): Promise<void> {
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now()),
    db.prepare('INSERT INTO sessions (id, number, created_at, expires_at) VALUES (?, ?, ?, ?)').bind(idHash, number, now(), expires),
  ]);
}

export async function sessionNumber(db: D1Database, idHash: string): Promise<string | null> {
  const row = await db.prepare('SELECT number FROM sessions WHERE id = ? AND expires_at > ?').bind(idHash, now()).first<{ number: string }>();
  return row?.number ?? null;
}

export async function outboxRows(db: D1Database, number?: string): Promise<OutboxRow[]> {
  const query = number
    ? db.prepare('SELECT * FROM outbox WHERE number = ? ORDER BY id LIMIT 100').bind(number)
    : db.prepare('SELECT * FROM outbox ORDER BY id LIMIT 100');
  return (await query.all<OutboxRow>()).results;
}

export const outboxDone = (db: D1Database, id: number): Promise<unknown> => db.prepare('DELETE FROM outbox WHERE id = ?').bind(id).run();

export const outboxLater = (db: D1Database, id: number, attempts: number, nextTryAt: string, error: string, flagged: boolean): Promise<unknown> =>
  db
    .prepare('UPDATE outbox SET attempts = ?, next_try_at = ?, last_error = ?, flagged = ? WHERE id = ?')
    .bind(attempts, nextTryAt, error, flagged ? 1 : 0, id)
    .run();
