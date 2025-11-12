/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add index on conversations(channel_id) for FK lookup optimization
    - Add index on membership_changes(user_id) for FK lookup optimization
    - Add index on requests(trip_id) for FK lookup optimization
    - Add index on travel_requests(user_id) for FK lookup optimization
    - Add index on trips(profile_id) for FK lookup optimization

  2. Security
    - These indexes improve query performance and prevent table scans
    - Essential for maintaining performance at scale

  3. Notes
    - Foreign keys without indexes can cause performance issues
    - These indexes are critical for JOIN operations and FK constraint checks
*/

-- Add index for conversations.channel_id foreign key
CREATE INDEX IF NOT EXISTS idx_conversations_channel_id 
ON conversations(channel_id);

-- Add index for membership_changes.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_membership_changes_user_id 
ON membership_changes(user_id);

-- Add index for requests.trip_id foreign key
CREATE INDEX IF NOT EXISTS idx_requests_trip_id 
ON requests(trip_id);

-- Add index for travel_requests.user_id foreign key
CREATE INDEX IF NOT EXISTS idx_travel_requests_user_id 
ON travel_requests(user_id);

-- Add index for trips.profile_id foreign key
CREATE INDEX IF NOT EXISTS idx_trips_profile_id 
ON trips(profile_id);