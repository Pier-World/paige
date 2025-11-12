/*
  # Enable RLS on Public Tables

  1. Security Improvements
    - Enable Row Level Security on all public tables
    - Add appropriate policies for data access control
    - Ensures no table is accidentally left unprotected

  2. Tables to Enable RLS
    - trips: User trip data
    - offers: Travel offers/options
    - tasks: Task management data
    - activities: Activity tracking data

  3. RLS Policies
    - Users can only access their own data
    - Service role has full access for backend operations
*/

-- Enable RLS on trips table
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips"
  ON trips FOR SELECT
  TO authenticated
  USING (profile_id = (select auth.uid()));

CREATE POLICY "Users can insert own trips"
  ON trips FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can update own trips"
  ON trips FOR UPDATE
  TO authenticated
  USING (profile_id = (select auth.uid()))
  WITH CHECK (profile_id = (select auth.uid()));

CREATE POLICY "Users can delete own trips"
  ON trips FOR DELETE
  TO authenticated
  USING (profile_id = (select auth.uid()));

-- Enable RLS on offers table
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offers for their requests"
  ON offers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = offers.request_id
      AND travel_requests.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can manage all offers"
  ON offers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their requests"
  ON tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM requests
      JOIN trips ON trips.id = requests.trip_id
      WHERE requests.id = tasks.request_id
      AND trips.profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can manage all tasks"
  ON tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Enable RLS on activities table
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities for their conversations"
  ON activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN channels ON channels.id = conversations.channel_id
      WHERE conversations.id = activities.conversation_id
      AND channels.profile_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can manage all activities"
  ON activities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);