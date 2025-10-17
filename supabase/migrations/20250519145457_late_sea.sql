/*
  # Add membership level to members table

  1. Changes
    - Add `membership_level` column to members table
    - Set default level to 'Standard'
    - Add check constraint to ensure valid levels
    - Backfill existing users with 'Standard' level

  2. Valid Levels
    - Standard
    - Premium
    - Executive
    - Founding Member
*/

ALTER TABLE members ADD COLUMN IF NOT EXISTS membership_level text NOT NULL DEFAULT 'Standard';

-- Add check constraint for valid membership levels
ALTER TABLE members ADD CONSTRAINT valid_membership_level 
  CHECK (membership_level IN ('Standard', 'Premium', 'Executive', 'Founding Member'));

-- Update existing members to have Standard level if not set
UPDATE members SET membership_level = 'Standard' WHERE membership_level IS NULL;