/*
  # Create API Credentials Table

  1. New Tables
    - `api_credentials`
      - `id` (uuid, primary key)
      - `provider` (text) - e.g., 'duffel', 'serpapi', 'mondee', 'amadeus'
      - `api_key` (text, encrypted)
      - `api_secret` (text, encrypted, optional)
      - `base_url` (text)
      - `is_active` (boolean)
      - `rate_limit_per_minute` (integer)
      - `priority` (smallint) - lower number = higher priority
      - `metadata` (jsonb) - provider-specific config
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `api_credentials` table
    - Only service role can access (no user access)
*/

CREATE TABLE IF NOT EXISTS api_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL UNIQUE,
  api_key text NOT NULL,
  api_secret text,
  base_url text NOT NULL,
  is_active boolean DEFAULT true,
  rate_limit_per_minute integer DEFAULT 60,
  priority smallint DEFAULT 100,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only"
  ON api_credentials
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_api_credentials_provider ON api_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_api_credentials_active ON api_credentials(is_active, priority);