-- Run this in Supabase → SQL Editor → New Query

CREATE TABLE calls (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  contact_name     TEXT,
  phone            TEXT,
  ghl_contact_id   TEXT,
  duration_seconds INTEGER     DEFAULT 0,
  ended_reason     TEXT,
  outcome          TEXT,
  quality          TEXT,
  customer_sentiment TEXT,
  transfer_completed BOOLEAN,
  objections       TEXT,
  summary          TEXT,
  recording_url    TEXT
);

-- Index for fast date-range queries
CREATE INDEX calls_created_at_idx ON calls (created_at DESC);
