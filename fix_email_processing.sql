-- SQL queries to troubleshoot and fix email processing

-- 1. Fix the UPDATE query syntax error (PostgreSQL doesn't support LIMIT in UPDATE)
-- Use a subquery instead:

UPDATE emails
SET processed = false
WHERE id IN (
  SELECT id
  FROM emails
  WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
    AND (
      subject ILIKE '%flight%' 
      OR subject ILIKE '%hotel%' 
      OR subject ILIKE '%confirmation%'
      OR subject ILIKE '%booking%'
      OR subject ILIKE '%reservation%'
    )
  LIMIT 1
);

-- 2. Check if Gmail sync has run and populated emails
SELECT 
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE processed = false) as unprocessed_by_sync,
  COUNT(*) FILTER (WHERE processed = true) as processed_by_sync,
  COUNT(*) FILTER (WHERE category = 'travel_confirmation') as travel_confirmations,
  MIN(received_at) as oldest_email,
  MAX(received_at) as newest_email
FROM emails
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c';

-- 3. Check which emails have email_context records (processed by parse-emails)
SELECT 
  e.id as email_id,
  e.subject,
  e.category,
  e.processed as processed_by_sync,
  ec.id as email_context_id,
  ec.confirmation_type,
  ec.extraction_confidence
FROM emails e
LEFT JOIN email_context ec ON e.id = ec.email_id
WHERE e.user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND e.received_at >= NOW() - INTERVAL '60 days'
ORDER BY e.received_at DESC
LIMIT 20;

-- 4. Reset emails for testing (mark as unprocessed by parse-emails)
-- This removes email_context records so parse-emails will process them again
DELETE FROM email_context
WHERE email_id IN (
  SELECT id
  FROM emails
  WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
    AND category = 'travel_confirmation'
    AND received_at >= NOW() - INTERVAL '60 days'
  LIMIT 10
);

-- 5. Check Gmail sync status
SELECT 
  provider,
  is_active,
  last_sync_at,
  sync_cursor
FROM integrations
WHERE user_id = '66f01217-1e16-40e2-86cf-bb5afef42f4c'
  AND provider = 'google_gmail';

