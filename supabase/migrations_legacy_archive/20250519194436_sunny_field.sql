/*
  # Create travel requests table

  1. New Tables
    - `travel_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references members)
      - `travel_type` (text)
      - `ambiance` (text)
      - `budget` (text)
      - `description` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users to create and read their own requests
*/

CREATE TABLE travel_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES members(id) ON DELETE CASCADE,
  travel_type text NOT NULL,
  ambiance text NOT NULL,
  budget text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_travel_type CHECK (travel_type IN ('commercial', 'private')),
  CONSTRAINT valid_ambiance CHECK (ambiance IN ('boutique', 'luxury', 'modern', 'classic')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE travel_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own travel requests"
  ON travel_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own travel requests"
  ON travel_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_travel_requests_updated_at
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();