/*
  # Add updated_at to requests table
  
  Add missing updated_at column to requests table and set up trigger
*/

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'requests' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE requests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Drop the trigger if it exists (from previous migration)
DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;

-- Create trigger for requests table
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();