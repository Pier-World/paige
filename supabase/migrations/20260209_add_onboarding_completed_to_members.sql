-- Add onboarding_completed to members so we have a reliable source even when profile is missing.
-- Profile remains the primary place for rich onboarding data; this is a denormalized flag for routing.

ALTER TABLE members
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN members.onboarding_completed IS 'Whether the member has completed the onboarding flow. Denormalized from profiles for reliable auth routing.';
