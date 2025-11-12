/*
  # Fix Function Search Path Security Issue

  1. Security Improvement
    - Fix search_path mutability in update_updated_at_column function
    - Prevents potential security vulnerabilities from search path manipulation
    - Sets explicit search path for function execution

  2. Changes
    - Drop and recreate function with SECURITY DEFINER and explicit search_path
    - Set search_path to 'public' for predictable function behavior
    
  3. Security
    - Prevents schema injection attacks
    - Ensures function always executes in expected schema context
*/

-- Drop existing function
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Recreate with proper search path security
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Recreate triggers that use this function
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_requests_updated_at ON requests;
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_travel_requests_updated_at ON travel_requests;
CREATE TRIGGER update_travel_requests_updated_at
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();