-- Pier OS v2 MVP schema migration
-- Non-destructive: extends existing tables (profiles, tasks, conversations)
-- and adds new tables (integrations, entities, relationships, calendar_events,
-- emails, notifications, automations) with RLS policies.

-- ============================================================================
-- PART A: Extend existing tables to match MVP schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- A.1: Extend profiles table (treating it as user_profiles)
-- ----------------------------------------------------------------------------
-- Add MVP columns to profiles table if they don't exist
DO $$
BEGIN
  -- Add time_zone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'time_zone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN time_zone TEXT DEFAULT 'America/New_York';
  END IF;

  -- Add travel_preferences column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'travel_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN travel_preferences JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add onboarding_completed column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index on email if it doesn't exist (profiles table may have email or we reference members.email)
-- Note: We check if the index exists first
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email) WHERE email IS NOT NULL;

-- ----------------------------------------------------------------------------
-- A.2: Extend tasks table
-- ----------------------------------------------------------------------------
-- Add MVP columns to tasks table if they don't exist
DO $$
BEGIN
  -- Add user_id column if it doesn't exist (MVP requires direct user_id reference)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add task_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'task_type'
  ) THEN
    ALTER TABLE tasks ADD COLUMN task_type TEXT;
  END IF;

  -- Add assigned_agent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_agent'
  ) THEN
    ALTER TABLE tasks ADD COLUMN assigned_agent TEXT;
  END IF;

  -- Add priority column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority INTEGER DEFAULT 5;
  END IF;

  -- Add input_data column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'input_data'
  ) THEN
    ALTER TABLE tasks ADD COLUMN input_data JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add output_data column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'output_data'
  ) THEN
    ALTER TABLE tasks ADD COLUMN output_data JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add requires_human column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'requires_human'
  ) THEN
    ALTER TABLE tasks ADD COLUMN requires_human BOOLEAN DEFAULT false;
  END IF;

  -- Add escalation_reason column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'escalation_reason'
  ) THEN
    ALTER TABLE tasks ADD COLUMN escalation_reason TEXT;
  END IF;

  -- Add due_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date TIMESTAMPTZ;
  END IF;

  -- Add started_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN started_at TIMESTAMPTZ;
  END IF;

  -- Add completed_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- Add created_at column if it doesn't exist (MVP requires it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add status column if it doesn't exist (MVP requires it with default 'pending')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;

  -- Add title column if it doesn't exist (MVP requires it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'title'
  ) THEN
    ALTER TABLE tasks ADD COLUMN title TEXT;
  END IF;

  -- Add description column if it doesn't exist (MVP allows it to be nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'description'
  ) THEN
    ALTER TABLE tasks ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create MVP indexes on tasks table if they don't exist
-- Only create indexes if the required columns exist
DO $$
BEGIN
  -- Check if status column exists before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status) WHERE user_id IS NOT NULL;
  END IF;

  -- Check if created_at column exists before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_user_created ON tasks(user_id, created_at DESC) WHERE user_id IS NOT NULL;
  END IF;

  -- Check if assigned_agent and status columns exist before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'assigned_agent'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(assigned_agent, status) WHERE assigned_agent IS NOT NULL;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- A.3: Extend conversations table
-- ----------------------------------------------------------------------------
-- Add MVP columns to conversations table if they don't exist
-- Note: Existing conversations table may have channel_id, front_conversation_id, etc.
-- We're adding MVP columns: role, content, related_task_id, metadata
DO $$
BEGIN
  -- Add role column (for message role: 'user', 'assistant', 'system')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'role'
  ) THEN
    ALTER TABLE conversations ADD COLUMN role TEXT;
  END IF;

  -- Add content column (for message content)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'content'
  ) THEN
    ALTER TABLE conversations ADD COLUMN content TEXT;
  END IF;

  -- Add related_task_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'related_task_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN related_task_id UUID REFERENCES tasks(id);
  END IF;

  -- Add metadata column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE conversations ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;

  -- Add user_id column if it doesn't exist (MVP requires user_id)
  -- Note: Existing conversations may use profile_id via channels, but MVP wants direct user_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add created_at column if it doesn't exist (MVP requires it)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create MVP indexes on conversations table if they don't exist
-- Only create indexes if the required columns exist
DO $$
BEGIN
  -- Check if created_at and user_id columns exist before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'created_at'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_user_created ON conversations(user_id, created_at DESC) WHERE user_id IS NOT NULL;
  END IF;

  -- Check if related_task_id column exists before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'related_task_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_task ON conversations(related_task_id) WHERE related_task_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- PART B: Create new MVP tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- B.1: Create integrations table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Integration Type
  provider TEXT NOT NULL, -- 'google_gmail', 'google_calendar', 'stripe'

  -- OAuth Tokens (ENCRYPTED at application layer)
  access_token TEXT, -- encrypted
  refresh_token TEXT, -- encrypted
  expires_at TIMESTAMPTZ,
  scopes TEXT[],

  -- Sync State
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT, -- Gmail historyId, Calendar syncToken, etc.

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(user_id, is_active) WHERE is_active = true;

-- ----------------------------------------------------------------------------
-- B.2: Create entities table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Entity Type & Data
  entity_type TEXT NOT NULL, -- 'trip', 'flight', 'hotel', 'person', 'loyalty_account', 'payment_method'
  data JSONB NOT NULL, -- All entity-specific data goes here

  -- Metadata
  source TEXT, -- 'gmail', 'calendar', 'user_input', 'agent'
  source_id TEXT, -- Reference to source (email_id, calendar_event_id)
  confidence FLOAT DEFAULT 1.0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entities_user_type ON entities(user_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_source ON entities(source, source_id);
CREATE INDEX IF NOT EXISTS idx_entities_created ON entities(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- B.3: Create relationships table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  from_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  to_entity_id UUID REFERENCES entities(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL, -- 'includes', 'paid_with', 'booked_with', 'related_to'

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relationships_from ON relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_user ON relationships(user_id);

-- ----------------------------------------------------------------------------
-- B.4: Create calendar_events table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Google Calendar IDs
  gcal_event_id TEXT NOT NULL,
  gcal_calendar_id TEXT NOT NULL,

  -- Event Data
  title TEXT,
  description TEXT,
  location TEXT,

  -- Timing
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  time_zone TEXT,

  -- Status
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'

  -- Related entities (denormalized for quick access)
  related_trip_id UUID REFERENCES entities(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, gcal_event_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_trip ON calendar_events(related_trip_id) WHERE related_trip_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- B.5: Create emails table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Gmail metadata
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,

  -- Email basics
  subject TEXT,
  from_address TEXT,
  received_at TIMESTAMPTZ NOT NULL,

  -- Body (truncated for performance)
  body_preview TEXT, -- First 500 chars

  -- Classification
  category TEXT, -- 'travel_confirmation', 'receipt', 'other'

  -- Extracted data
  extracted_data JSONB DEFAULT '{}'::jsonb,

  -- Processing
  processed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_user_received ON emails(user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_category ON emails(user_id, category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_emails_unprocessed ON emails(user_id) WHERE processed = false;

-- ----------------------------------------------------------------------------
-- B.6: Create notifications table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'info', -- 'info', 'alert', 'success', 'error'

  -- Action
  action_url TEXT,
  action_label TEXT,

  -- Related entities
  related_entity_id UUID REFERENCES entities(id),
  related_task_id UUID REFERENCES tasks(id),

  -- Status
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- ----------------------------------------------------------------------------
-- B.7: Create automations table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Automation definition
  name TEXT NOT NULL,
  automation_type TEXT NOT NULL, -- 'daily_brief', 'award_watch', 'trip_reminder'

  -- Config
  config JSONB DEFAULT '{}'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Execution tracking
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automations_user_active ON automations(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON automations(next_run_at) WHERE is_active = true;

-- ============================================================================
-- PART C: Enable RLS and add policies for new tables
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
-- Using pattern: "Users access own <table_name>" matching MVP spec

-- Integrations policies
DROP POLICY IF EXISTS "Users access own integrations" ON integrations;
CREATE POLICY "Users access own integrations"
  ON integrations FOR ALL
  USING (auth.uid() = user_id);

-- Entities policies
DROP POLICY IF EXISTS "Users access own entities" ON entities;
CREATE POLICY "Users access own entities"
  ON entities FOR ALL
  USING (auth.uid() = user_id);

-- Relationships policies
DROP POLICY IF EXISTS "Users access own relationships" ON relationships;
CREATE POLICY "Users access own relationships"
  ON relationships FOR ALL
  USING (auth.uid() = user_id);

-- Calendar events policies
DROP POLICY IF EXISTS "Users access own calendar_events" ON calendar_events;
CREATE POLICY "Users access own calendar_events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id);

-- Emails policies
DROP POLICY IF EXISTS "Users access own emails" ON emails;
CREATE POLICY "Users access own emails"
  ON emails FOR ALL
  USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users access own notifications" ON notifications;
CREATE POLICY "Users access own notifications"
  ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- Automations policies
DROP POLICY IF EXISTS "Users access own automations" ON automations;
CREATE POLICY "Users access own automations"
  ON automations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================================
-- PART D: Add updated_at triggers for new tables that need them
-- ============================================================================

-- Ensure update_updated_at_column function exists (it should from previous migrations)
-- If not, create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for tables with updated_at columns
DROP TRIGGER IF EXISTS update_integrations_updated_at ON integrations;
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_entities_updated_at ON entities;
CREATE TRIGGER update_entities_updated_at
  BEFORE UPDATE ON entities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_automations_updated_at ON automations;
CREATE TRIGGER update_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

