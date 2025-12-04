-- ============================================================================
-- Verify Tasks Created by Orchestrator
-- Run this to check that tasks were created with proper structure
-- ============================================================================

-- Replace with your user ID
\set user_id 'f78c2fcb-b2ba-4b75-8c4f-d7c73982c480'

-- ============================================================================
-- 1. View Latest Tasks with All Enhanced Fields
-- ============================================================================

SELECT 
  'LATEST TASKS' as check_type,
  id,
  title,
  status,
  task_type,
  confidence_score,
  risk_level,
  decision_strategy,
  ui_state->>'current_step' as current_step,
  ui_state->>'rendered_component' as component,
  (ui_state->>'progress')::int as progress,
  assigned_agent,
  created_at
FROM tasks
WHERE user_id = :'user_id'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 2. Check UI State Structure
-- ============================================================================

SELECT 
  'UI STATE STRUCTURE' as check_type,
  id,
  title,
  jsonb_pretty(ui_state) as ui_state_formatted
FROM tasks
WHERE user_id = :'user_id'
  AND ui_state IS NOT NULL
  AND ui_state != '{}'::jsonb
ORDER BY created_at DESC
LIMIT 3;

-- ============================================================================
-- 3. Check LLM Reasoning
-- ============================================================================

SELECT 
  'LLM REASONING' as check_type,
  id,
  title,
  jsonb_pretty(llm_reasoning) as reasoning_formatted
FROM tasks
WHERE user_id = :'user_id'
  AND llm_reasoning IS NOT NULL
  AND llm_reasoning != '{}'::jsonb
ORDER BY created_at DESC
LIMIT 3;

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
  ROUND(AVG(confidence_score), 2) as avg_confidence
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
  ROUND(AVG(confidence_score), 2) as avg_confidence
FROM tasks
WHERE user_id = :'user_id'
  AND decision_strategy IS NOT NULL
GROUP BY decision_strategy
ORDER BY count DESC;

-- ============================================================================
-- 6. Check Task-Conversation Linking
-- ============================================================================

SELECT 
  'TASK-CONVERSATION LINKING' as check_type,
  c.id as conversation_id,
  c.role,
  LEFT(c.content, 80) as content_preview,
  c.related_task_id,
  t.status as task_status,
  t.confidence_score,
  t.decision_strategy
FROM conversations c
LEFT JOIN tasks t ON t.id = c.related_task_id
WHERE c.user_id = :'user_id'
ORDER BY c.created_at DESC
LIMIT 10;

-- ============================================================================
-- 7. Check Input/Output Data
-- ============================================================================

SELECT 
  'INPUT/OUTPUT DATA' as check_type,
  id,
  title,
  input_data->>'intent' as intent,
  input_data->>'message' as message,
  input_data->'parameters' as parameters,
  output_data->>'search_type' as search_type,
  (output_data->>'results_count')::int as results_count
FROM tasks
WHERE user_id = :'user_id'
  AND (input_data IS NOT NULL OR output_data IS NOT NULL)
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 8. Summary Statistics
-- ============================================================================

SELECT 
  'SUMMARY STATISTICS' as check_type,
  COUNT(*) as total_tasks,
  COUNT(DISTINCT decision_strategy) as unique_strategies,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
  COUNT(*) FILTER (WHERE status = 'awaiting_human') as escalated,
  COUNT(*) FILTER (WHERE ui_state->>'rendered_component' IS NOT NULL) as with_ui_component,
  COUNT(*) FILTER (WHERE assigned_agent = 'travel') as travel_tasks
FROM tasks
WHERE user_id = :'user_id';

