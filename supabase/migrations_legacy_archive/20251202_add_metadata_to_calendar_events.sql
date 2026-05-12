-- Add metadata column to calendar_events table for storing attendees and other event data
-- This migration adds a metadata JSONB column if it doesn't exist

DO $$
BEGIN
  -- Add metadata column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    COMMENT ON COLUMN calendar_events.metadata IS 'Flexible storage for event metadata including attendees';
    RAISE NOTICE 'Added metadata column to calendar_events';
  END IF;
END $$;

