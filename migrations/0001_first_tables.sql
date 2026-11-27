-- The working copy of each job. mrkdevelopment.net holds the master record.
CREATE TABLE jobs (
  number     TEXT PRIMARY KEY,
  product    TEXT NOT NULL,
  stage      TEXT NOT NULL,
  data       TEXT NOT NULL,          -- the client's view of the job, as JSON
  code_enc   TEXT NOT NULL,          -- the private code, encrypted
  fetched_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Things the client did that mrkdevelopment.net has not accepted yet.
CREATE TABLE outbox (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  number          TEXT NOT NULL,
  action          TEXT NOT NULL,
  body            TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  attempts        INTEGER NOT NULL DEFAULT 0,
  next_try_at     TEXT NOT NULL,
  last_error      TEXT,
  created_at      TEXT NOT NULL,
  flagged         INTEGER NOT NULL DEFAULT 0  -- 1 once it has failed for 24 hours
);
CREATE INDEX outbox_number ON outbox (number, id);

-- One row per signed-in browser. The id is a hash of the cookie, never the cookie itself.
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  number     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
