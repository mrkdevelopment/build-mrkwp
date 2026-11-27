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
export async function recordAction(db: D1Database, row: JobRow, action: string, body: object, newStage: string, patch: Record<string, unknown> = {}): Promise<void> {
  const data = JSON.stringify({ ...JSON.parse(row.data), ...patch, stage: newStage });
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

// ---- Site checks -------------------------------------------------------------------------------

export interface ScanRunRow {
  id: number;
  number: string;
  address: string;
  started_at: string;
  finished_at: string | null;
  result: string | null;
}

export const latestRun = (db: D1Database, number: string): Promise<ScanRunRow | null> =>
  db.prepare('SELECT * FROM scan_runs WHERE number = ? ORDER BY id DESC LIMIT 1').bind(number).first<ScanRunRow>();

export async function countRuns(db: D1Database, number: string): Promise<number> {
  return (await db.prepare('SELECT COUNT(*) AS n FROM scan_runs WHERE number = ?').bind(number).first<{ n: number }>())?.n ?? 0;
}

export async function startRun(db: D1Database, number: string, address: string): Promise<number> {
  const made = await db.prepare('INSERT INTO scan_runs (number, address, started_at) VALUES (?, ?, ?)').bind(number, address, now()).run();
  return made.meta.last_row_id;
}

export const finishRun = (db: D1Database, id: number, result: object): Promise<unknown> =>
  db.prepare('UPDATE scan_runs SET finished_at = ?, result = ? WHERE id = ?').bind(now(), JSON.stringify(result), id).run();

// ---- Work in progress on "Your business" -------------------------------------------------------

export async function getDraft<T>(db: D1Database, number: string): Promise<T | null> {
  const row = await db.prepare('SELECT data FROM drafts WHERE number = ?').bind(number).first<{ data: string }>();
  return row ? (JSON.parse(row.data) as T) : null;
}

export const saveDraft = (db: D1Database, number: string, draft: object): Promise<unknown> =>
  db
    .prepare('INSERT INTO drafts (number, data, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT (number) DO UPDATE SET data = ?2, updated_at = ?3')
    .bind(number, JSON.stringify(draft), now())
    .run();

// ---- Wrong links tried -------------------------------------------------------------------------

const bucket = (): string => new Date(Math.floor(Date.now() / 600_000) * 600_000).toISOString();

export async function triesSoFar(db: D1Database, key: string): Promise<number> {
  return (await db.prepare('SELECT n FROM attempts WHERE key = ? AND bucket = ?').bind(key, bucket()).first<{ n: number }>())?.n ?? 0;
}

export const countTry = (db: D1Database, key: string): Promise<unknown> =>
  db.batch([
    db.prepare('INSERT INTO attempts (key, bucket, n) VALUES (?1, ?2, 1) ON CONFLICT (key, bucket) DO UPDATE SET n = n + 1').bind(key, bucket()),
    db.prepare('DELETE FROM attempts WHERE bucket < ?').bind(new Date(Date.now() - 3_600_000).toISOString()),
  ]);
