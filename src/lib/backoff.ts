// How long the outbox waits before trying a row again.

const MINUTE = 60_000;

/** Backend answer meaning "this version of mrkwp-core doesn't take that action yet". */
export const NOT_BUILT_YET = 'mrkwp_build_action';

/** 1, 2, 4, 8 ... minutes after each failure, never more than an hour. */
export const retryDelay = (attempts: number): number => Math.min(2 ** Math.max(attempts - 1, 0), 60) * MINUTE;

/** A row that has been failing for a day is flagged for a person to look at. It is still retried. */
export const isOverdue = (createdAt: string, now: number): boolean => now - Date.parse(createdAt) > 24 * 60 * MINUTE;
