-- ============================================================================
-- Enhanced Tasks Table for Task-First Architecture
-- Purpose: Add columns for UI state, confidence tracking, risk assessment, and execution strategy
-- ============================================================================

-- Add UI state column for rich component rendering
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ui_state JSONB DEFAULT '{}'::jsonb;

-- Add confidence score (0.00 to 1.00)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1);

-- Add risk level for execution decisions
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high'));

-- Add decision strategy (how to handle this task)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS decision_strategy TEXT CHECK (decision_strategy IN ('auto_execute', 'preview_confirm', 'clarify', 'escalate'));

-- Add idempotency key to prevent duplicate tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Add LLM reasoning for transparency and debugging
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS llm_reasoning JSONB DEFAULT '{}'::jsonb;

-- Create unique index on idempotency_key
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_idempotency_key ON tasks(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Create GIN index on ui_state for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_tasks_ui_state_gin ON tasks USING GIN (ui_state);

-- Create index for real-time UI updates (user + status)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_realtime ON tasks(user_id, status, created_at DESC);

-- Create index for confidence-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_confidence ON tasks(confidence_score) WHERE confidence_score IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN tasks.ui_state IS 'Rich UI state for component rendering: {current_step, progress, results_preview, needs_decision, rendered_component}';
COMMENT ON COLUMN tasks.confidence_score IS 'LLM confidence in understanding the request (0.00-1.00)';
COMMENT ON COLUMN tasks.risk_level IS 'Risk level of auto-executing: low (read-only), medium (modifications), high (financial)';
COMMENT ON COLUMN tasks.decision_strategy IS 'Execution strategy: auto_execute, preview_confirm, clarify, escalate';
COMMENT ON COLUMN tasks.idempotency_key IS 'Unique key to prevent duplicate task creation from same request';
COMMENT ON COLUMN tasks.llm_reasoning IS 'LLM reasoning and assumptions for transparency';

-- ============================================================================
-- Add helper function to generate idempotency key
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_task_idempotency_key(p_user_id UUID, p_message TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Generate deterministic key from user_id + normalized message
  RETURN encode(digest(p_user_id::text || lower(trim(p_message)), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Add function to get task with UI state
-- ============================================================================

CREATE OR REPLACE FUNCTION get_task_with_ui_state(p_task_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  task_type TEXT,
  status TEXT,
  ui_state JSONB,
  confidence_score DECIMAL,
  risk_level TEXT,
  decision_strategy TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.task_type,
    t.status,
    t.ui_state,
    t.confidence_score,
    t.risk_level,
    t.decision_strategy,
    t.created_at,
    t.updated_at
  FROM tasks t
  WHERE t.id = p_task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_task_with_ui_state(UUID) TO authenticated;

