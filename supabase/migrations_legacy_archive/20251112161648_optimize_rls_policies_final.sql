/*
  # Optimize RLS Policies with SELECT auth.uid()

  1. Performance Improvements
    - Replace direct auth.uid() calls with (select auth.uid())
    - This prevents re-evaluation of auth.uid() for each row
    - Significantly improves query performance at scale

  2. Changes
    - Drop and recreate all RLS policies that use auth.uid()
    - Use SELECT subquery pattern for auth function calls
    - Maintains same security logic with better performance

  3. Security
    - No change to security model
    - Same access controls, just optimized execution
*/

-- profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- members table policies
DROP POLICY IF EXISTS "Users can read own data" ON members;
CREATE POLICY "Users can read own data"
  ON members FOR SELECT
  TO authenticated
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own data" ON members;
CREATE POLICY "Users can update own data"
  ON members FOR UPDATE
  TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- membership_changes table policies
DROP POLICY IF EXISTS "Users can read own membership changes" ON membership_changes;
CREATE POLICY "Users can read own membership changes"
  ON membership_changes FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own membership changes" ON membership_changes;
CREATE POLICY "Users can insert own membership changes"
  ON membership_changes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- travel_requests table policies
DROP POLICY IF EXISTS "Users can read their own travel requests" ON travel_requests;
CREATE POLICY "Users can read their own travel requests"
  ON travel_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create their own travel requests" ON travel_requests;
CREATE POLICY "Users can create their own travel requests"
  ON travel_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- requests table policies
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = requests.trip_id
      AND trips.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own requests" ON requests;
CREATE POLICY "Users can insert own requests"
  ON requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = requests.trip_id
      AND trips.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own requests" ON requests;
CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = requests.trip_id
      AND trips.profile_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trips
      WHERE trips.id = requests.trip_id
      AND trips.profile_id = (select auth.uid())
    )
  );

-- messages table policies
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN channels ON channels.id = conversations.channel_id
      WHERE conversations.id = messages.conversation_id
      AND channels.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      JOIN channels ON channels.id = conversations.channel_id
      WHERE conversations.id = messages.conversation_id
      AND channels.profile_id = (select auth.uid())
    )
  );

-- channels table policies
DROP POLICY IF EXISTS "Users can view own channels" ON channels;
CREATE POLICY "Users can view own channels"
  ON channels FOR SELECT
  TO authenticated
  USING (profile_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own channels" ON channels;
CREATE POLICY "Users can insert own channels"
  ON channels FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = (select auth.uid()));

-- conversations table policies
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = conversations.channel_id
      AND channels.profile_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM channels
      WHERE channels.id = conversations.channel_id
      AND channels.profile_id = (select auth.uid())
    )
  );

-- events table policies (admin check from members table)
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );