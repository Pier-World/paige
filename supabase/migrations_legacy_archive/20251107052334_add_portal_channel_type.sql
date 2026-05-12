/*
  # Add 'portal' to channels type constraint

  1. Changes
    - Drop existing channels_type_check constraint
    - Add new constraint that includes 'portal' as valid channel type
  
  2. Purpose
    - Allow portal-based conversations to be created
    - Portal represents the web portal interface where members interact directly
*/

-- Drop the existing constraint
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_type_check;

-- Add new constraint with 'portal' included
ALTER TABLE channels ADD CONSTRAINT channels_type_check 
  CHECK (type = ANY (ARRAY['email'::text, 'whatsapp'::text, 'sms'::text, 'front'::text, 'portal'::text]));
