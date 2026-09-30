-- Gemini's conversation memory per execution: every turn sent to or received from the model (the user's request
-- and change instructions, the model's tool calls, our tool results and the gate's feedback), exactly as sent.
-- Append-only, like the event log: memory is never edited or lost, and survives restarts.
CREATE TABLE pp_conversation_turn (
  id           BIGSERIAL   PRIMARY KEY,
  execution_id VARCHAR(64) NOT NULL REFERENCES pp_execution (id),
  seq          INTEGER     NOT NULL,
  role         VARCHAR(16) NOT NULL,   -- user | model
  kind         VARCHAR(24) NOT NULL,   -- request | revision | model | tool_results | gate_feedback | context
  content      JSONB       NOT NULL,   -- the Gemini "content" object, verbatim
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (execution_id, seq)
);

CREATE FUNCTION pp_conversation_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pp_conversation_turn is append-only (% rejected)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pp_conversation_no_update BEFORE UPDATE OR DELETE ON pp_conversation_turn
  FOR EACH ROW EXECUTE FUNCTION pp_conversation_append_only();

-- A change requested by a person after the AI produced a proposal.
CREATE TABLE pp_revision (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id   VARCHAR(64)  NOT NULL REFERENCES pp_execution (id),
  instruction    TEXT         NOT NULL,
  from_iteration INTEGER      NOT NULL,
  to_iteration   INTEGER,
  status         VARCHAR(20)  NOT NULL CHECK (status IN ('running', 'passed', 'blocked', 'failed')),
  detail         TEXT,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pp_revision_exec ON pp_revision (execution_id, created_at);

-- The pre-deployment report: required for the approved run before anything is published to PolicyCenter.
CREATE TABLE pp_report (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id  VARCHAR(64) NOT NULL REFERENCES pp_execution (id),
  run_id        VARCHAR(64) NOT NULL REFERENCES pp_verification_run (id),
  report        JSONB       NOT NULL,
  report_sha256 CHAR(64)    NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pp_report_exec ON pp_report (execution_id, created_at DESC);

ALTER TABLE pp_deployment ADD COLUMN report_id UUID REFERENCES pp_report (id);
