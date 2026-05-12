/*
  # Create User Preferences and Context System

  1. New Tables
    - user_preferences - Stores user travel preferences
    - user_context_history - Tracks user interaction history

  2. Security
    - Enable RLS on both tables
    - Users can only access their own data
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  travel_preferences jsonb DEFAULT '{"flight": {"preferred_airlines": [], "seat_preference": "window", "cabin_class": "economy", "nonstop_preferred": true}, "hotel": {"preferred_brands": [], "room_type": "standard", "amenities": [], "location_preference": "central"}, "dining": {"cuisine_preferences": [], "dining_style": ["fine_dining", "local"], "price_range": "moderate"}}'::jsonb,
  budget_ranges jsonb DEFAULT '{"flight": {"min": 0, "max": 1000, "flexible": true}, "hotel": {"per_night_min": 0, "per_night_max": 300, "flexible": true}, "dining": {"per_meal_min": 0, "per_meal_max": 100, "flexible": true}}'::jsonb,
  special_requirements jsonb DEFAULT '{"dietary": [], "accessibility": [], "allergies": []}'::jsonb,
  loyalty_programs jsonb DEFAULT '[]'::jsonb,
  payment_preferences jsonb DEFAULT '{"default_card_on_file": false, "preferred_payment_method": "card"}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_context_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES concierge_conversations(id) ON DELETE SET NULL,
  context_type text NOT NULL CHECK (context_type IN ('preference_learned', 'search_performed', 'booking_made', 'feedback_given', 'clarification_asked', 'interest_expressed')),
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_profile_id ON user_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_context_history_profile_id ON user_context_history(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_context_history_conversation_id ON user_context_history(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_context_history_created_at ON user_context_history(created_at DESC);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can view own context history"
  ON user_context_history
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "System can insert context history"
  ON user_context_history
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();