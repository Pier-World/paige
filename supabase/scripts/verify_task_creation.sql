-- ============================================================================
-- Verify Task Creation and Enhanced Fields
-- Run this after testing the orchestrator to verify everything is working
-- ============================================================================

-- Replace 'your-user-uuid' with your actual user ID
\set user_id 'your-user-uuid'

-- ============================================================================
-- 1. Check Latest Tasks
-- ============================================================================

SELECT 
  'LATEST TASKS' as check_type,
  id,
  title,
  status,
  confidence_score,
  risk_level,
  decision_strategy,
  ui_state->>'current_step' as current_step,
  ui_state->>'rendered_component' as component,
  (ui_state->>'progress')::int as progress,
  created_at
FROM tasks
WHERE user_id = :'user_id'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 2. Check UI State Structure
-- ============================================================================

SELECT 
  'UI STATE STRUCTURE' as check_type,
  id,
  ui_state,
  jsonb_pretty(ui_state) as ui_state_formatted
FROM tasks
WHERE user_id = :'user_id'
  AND ui_state IS NOT NULL
  AND ui_state != '{}'::jsonb
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- 3. Check LLM Reasoning
-- ============================================================================

SELECT 
  'LLM REASONING' as check_type,
  id,
  llm_reasoning,
  jsonb_pretty(llm_reasoning) as reasoning_formatted
FROM tasks
WHERE user_id = :'user_id'
  AND llm_reasoning IS NOT NULL
  AND llm_reasoning != '{}'::jsonb
ORDER BY created_at DESC
LIMIT 1;

-- ============================================================================
-- 4. Check Confidence Score Distribution
-- ============================================================================

SELECT 
  'CONFIDENCE DISTRIBUTION' as check_type,
  CASE 
    WHEN confidence_score >= 0.9 THEN 'High (0.9-1.0)'
    WHEN confidence_score >= 0.7 THEN 'Medium (0.7-0.9)'
    WHEN confidence_score >= 0.4 THEN 'Low (0.4-0.7)'
    ELSE 'Very Low (<0.4)'
  END as confidence_range,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM tasks
WHERE user_id = :'user_id'
  AND confidence_score IS NOT NULL
GROUP BY confidence_range
ORDER BY avg_confidence DESC;

-- ============================================================================
-- 5. Check Decision Strategy Distribution
-- ============================================================================

SELECT 
  'DECISION STRATEGY DISTRIBUTION' as check_type,
  decision_strategy,
  COUNT(*) as count,
  AVG(confidence_score) as avg_confidence
FROM tasks
WHERE user_id = :'user_id'
  AND decision_strategy IS NOT NULL
GROUP BY decision_strategy
ORDER BY count DESC;

-- ============================================================================
-- 6. Check Idempotency (should have no duplicates)
-- ============================================================================

SELECT 
  'IDEMPOTENCY CHECK' as check_type,
  idempotency_key,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY created_at) as task_ids
FROM tasks
WHERE user_id = :'user_id'
  AND idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1;

-- Should return 0 rows (no duplicates)

-- ============================================================================
-- 7. Check Task-Conversation Linking
-- ============================================================================

SELECT 
  'TASK-CONVERSATION LINKING' as check_type,
  c.id as conversation_id,
  c.role,
  LEFT(c.content, 50) as content_preview,
  c.related_task_id,
  t.status as task_status,
  t.confidence_score
FROM conversations c
LEFT JOIN tasks t ON t.id = c.related_task_id
WHERE c.user_id = :'user_id'
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================================================
-- 8. Check Travel Agent Results
-- ============================================================================

SELECT 
  'TRAVEL AGENT RESULTS' as check_type,
  id,
  output_data->>'search_type' as search_type,
  (output_data->>'results_count')::int as results_count,
  output_data->'top_options' as top_options,
  ui_state->>'rendered_component' as component
FROM tasks
WHERE user_id = :'user_id'
  AND output_data IS NOT NULL
  AND output_data->>'search_type' = 'flight'
ORDER BY created_at DESC
LIMIT 3;

-- ============================================================================
-- 9. Summary Statistics
-- ============================================================================

SELECT 
  'SUMMARY STATISTICS' as check_type,
  COUNT(*) as total_tasks,
  COUNT(DISTINCT decision_strategy) as unique_strategies,
  AVG(confidence_score) as avg_confidence,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'awaiting_human') as escalated,
  COUNT(*) FILTER (WHERE ui_state->>'rendered_component' IS NOT NULL) as with_ui_component
FROM tasks
WHERE user_id = :'user_id';

