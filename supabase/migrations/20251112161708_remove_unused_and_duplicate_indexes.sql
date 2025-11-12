/*
  # Remove Unused and Duplicate Indexes

  1. Performance Improvements
    - Remove indexes that are not being used by queries
    - Remove duplicate indexes that serve the same purpose
    - Reduces database storage and maintenance overhead
    - Improves write performance

  2. Changes
    - Drop unused indexes identified by Supabase analyzer
    - Drop duplicate indexes, keeping the better-named one
    
  3. Indexes Removed
    - Unused: idx_channels_external, idx_requests_profile_status, 
      idx_requests_entities_gin, idx_profiles_email, idx_messages_intent,
      idx_conversations_profile_id, idx_activities_conversation, idx_requests_status
    - Duplicates: idx_messages_request (keeping idx_messages_request_id),
      idx_requests_created (keeping idx_requests_created_at)
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_channels_external;
DROP INDEX IF EXISTS idx_requests_profile_status;
DROP INDEX IF EXISTS idx_requests_entities_gin;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_messages_intent;
DROP INDEX IF EXISTS idx_conversations_profile_id;
DROP INDEX IF EXISTS idx_activities_conversation;
DROP INDEX IF EXISTS idx_requests_status;

-- Drop duplicate indexes (keeping the more descriptive names)
DROP INDEX IF EXISTS idx_messages_request;
DROP INDEX IF EXISTS idx_requests_created;