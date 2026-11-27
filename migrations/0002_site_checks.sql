-- Each time a client's site is checked. The result is kept so a reload never checks again.
CREATE TABLE scan_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  number      TEXT NOT NULL,
  address     TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  result      TEXT                  -- what was found, as JSON
);
CREATE INDEX scan_runs_number ON scan_runs (number, id);

-- Where a client is up to in "Your business", and what they have typed or corrected so far.
-- Kept apart from the job so a fresh copy from mrkdevelopment.net never wipes work in progress.
CREATE TABLE drafts (
  number     TEXT PRIMARY KEY,
  data       TEXT NOT NULL,         -- JSON
  updated_at TEXT NOT NULL
);

-- Wrong links tried from one place in the last few minutes, so guessing codes can be slowed down.
-- The key is a scrambled form of the visitor's network address: it can't be turned back into one.
CREATE TABLE attempts (
  key    TEXT NOT NULL,
  bucket TEXT NOT NULL,             -- the ten-minute window
  n      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, bucket)
);
