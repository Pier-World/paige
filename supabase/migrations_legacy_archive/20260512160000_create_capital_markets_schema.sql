/*
  # Create capital markets schema

  Adds non-destructive capital_* tables for the Pier capital markets area.
  This migration intentionally does not alter legacy events, perks, members,
  profiles, auth, onboarding, Intercom, Edge Functions, storage, or frontend
  pages.
*/

CREATE OR REPLACE FUNCTION capital_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS capital_member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  display_name text NOT NULL,
  role text NOT NULL,
  firm text NOT NULL,
  title text,
  location text,
  aum_display text,
  aum_numeric numeric(16, 2),
  currency_code text NOT NULL DEFAULT 'USD',
  focus_sectors text[] NOT NULL DEFAULT '{}',
  bio text,
  avatar_url text,
  verified boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_member_profiles_role_check CHECK (role IN ('gp', 'lp')),
  CONSTRAINT capital_member_profiles_status_check CHECK (status IN ('draft', 'active', 'hidden', 'archived')),
  CONSTRAINT capital_member_profiles_currency_code_check CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT capital_member_profiles_aum_numeric_check CHECK (aum_numeric IS NULL OR aum_numeric >= 0)
);

CREATE TABLE IF NOT EXISTS capital_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  manager_name text NOT NULL,
  sponsor_profile_id uuid REFERENCES capital_member_profiles(id) ON DELETE SET NULL,
  deal_type text NOT NULL,
  asset_class text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  target_size numeric(16, 2) NOT NULL,
  raised_size numeric(16, 2) NOT NULL DEFAULT 0,
  min_commitment numeric(16, 2),
  currency_code text NOT NULL DEFAULT 'USD',
  close_date date,
  target_irr numeric(6, 2),
  moic_target numeric(6, 2),
  vintage integer,
  geography text,
  sectors text[] NOT NULL DEFAULT '{}',
  description text NOT NULL,
  thesis text,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_deals_deal_type_check CHECK (deal_type IN ('fund', 'co-invest', 'secondary', 'spv')),
  CONSTRAINT capital_deals_status_check CHECK (status IN ('pending', 'open', 'closing', 'closed')),
  CONSTRAINT capital_deals_currency_code_check CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT capital_deals_target_size_check CHECK (target_size >= 0),
  CONSTRAINT capital_deals_raised_size_check CHECK (raised_size >= 0),
  CONSTRAINT capital_deals_min_commitment_check CHECK (min_commitment IS NULL OR min_commitment >= 0),
  CONSTRAINT capital_deals_target_irr_check CHECK (target_irr IS NULL OR target_irr >= 0),
  CONSTRAINT capital_deals_moic_target_check CHECK (moic_target IS NULL OR moic_target >= 0),
  CONSTRAINT capital_deals_vintage_check CHECK (vintage IS NULL OR vintage BETWEEN 1900 AND 2200),
  CONSTRAINT capital_deals_contacts_check CHECK (jsonb_typeof(contacts) = 'array')
);

CREATE TABLE IF NOT EXISTS capital_deal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES capital_deals(id) ON DELETE CASCADE,
  label text NOT NULL,
  document_type text NOT NULL,
  display_size text,
  file_size_bytes bigint,
  storage_path text,
  external_url text,
  access_level text NOT NULL DEFAULT 'members',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_deal_documents_document_type_check CHECK (
    document_type IN ('deck', 'memo', 'tearsheet', 'legal', 'financials', 'other')
  ),
  CONSTRAINT capital_deal_documents_access_level_check CHECK (
    access_level IN ('members', 'approved_interest', 'admin')
  ),
  CONSTRAINT capital_deal_documents_file_size_bytes_check CHECK (
    file_size_bytes IS NULL OR file_size_bytes >= 0
  )
);

CREATE TABLE IF NOT EXISTS capital_deal_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES capital_deals(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  request_type text NOT NULL DEFAULT 'express_interest',
  status text NOT NULL DEFAULT 'submitted',
  commitment_amount numeric(16, 2),
  currency_code text NOT NULL DEFAULT 'USD',
  message text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_deal_interests_request_type_check CHECK (
    request_type IN ('express_interest', 'schedule_call', 'request_documents')
  ),
  CONSTRAINT capital_deal_interests_status_check CHECK (
    status IN ('submitted', 'under_review', 'approved', 'intro_scheduled', 'declined', 'withdrawn')
  ),
  CONSTRAINT capital_deal_interests_currency_code_check CHECK (currency_code ~ '^[A-Z]{3}$'),
  CONSTRAINT capital_deal_interests_commitment_amount_check CHECK (
    commitment_amount IS NULL OR commitment_amount >= 0
  ),
  CONSTRAINT capital_deal_interests_unique_request UNIQUE (deal_id, member_id, request_type)
);

CREATE TABLE IF NOT EXISTS capital_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text NOT NULL,
  city text NOT NULL,
  capacity integer,
  registered_count integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  recap_url text,
  featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_events_event_type_check CHECK (
    event_type IN ('dinner', 'summit', 'roundtable', 'tour', 'webinar')
  ),
  CONSTRAINT capital_events_status_check CHECK (status IN ('draft', 'upcoming', 'completed', 'cancelled')),
  CONSTRAINT capital_events_capacity_check CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT capital_events_registered_count_check CHECK (registered_count >= 0),
  CONSTRAINT capital_events_registered_capacity_check CHECK (capacity IS NULL OR registered_count <= capacity),
  CONSTRAINT capital_events_ends_at_check CHECK (ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS capital_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES capital_events(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'requested',
  attendee_count integer NOT NULL DEFAULT 1,
  message text,
  admin_notes text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_event_rsvps_status_check CHECK (
    status IN ('requested', 'confirmed', 'waitlisted', 'attended', 'cancelled', 'declined')
  ),
  CONSTRAINT capital_event_rsvps_attendee_count_check CHECK (attendee_count > 0),
  CONSTRAINT capital_event_rsvps_unique_member_event UNIQUE (event_id, member_id)
);

CREATE TABLE IF NOT EXISTS capital_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  tagline text,
  benefit text NOT NULL,
  description text NOT NULL,
  website_url text,
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_partners_category_check CHECK (
    category IN ('hotels', 'restaurants', 'travel', 'lifestyle', 'finance', 'health')
  ),
  CONSTRAINT capital_partners_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'))
);

CREATE TABLE IF NOT EXISTS capital_partner_intros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES capital_partners(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'submitted',
  message text,
  contact_preference text,
  admin_notes text,
  introduced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_partner_intros_status_check CHECK (
    status IN ('submitted', 'in_review', 'introduced', 'declined', 'cancelled')
  ),
  CONSTRAINT capital_partner_intros_contact_preference_check CHECK (
    contact_preference IS NULL OR contact_preference IN ('email', 'phone', 'concierge')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_member_profiles_member_id
  ON capital_member_profiles(member_id)
  WHERE member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_member_profiles_status_sort
  ON capital_member_profiles(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_capital_member_profiles_role_status
  ON capital_member_profiles(role, status);
CREATE INDEX IF NOT EXISTS idx_capital_member_profiles_verified
  ON capital_member_profiles(verified)
  WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_capital_member_profiles_focus_sectors
  ON capital_member_profiles USING GIN (focus_sectors);

CREATE INDEX IF NOT EXISTS idx_capital_deals_status_close_date
  ON capital_deals(status, close_date);
CREATE INDEX IF NOT EXISTS idx_capital_deals_deal_type_status
  ON capital_deals(deal_type, status);
CREATE INDEX IF NOT EXISTS idx_capital_deals_asset_class
  ON capital_deals(asset_class);
CREATE INDEX IF NOT EXISTS idx_capital_deals_sponsor_profile_id
  ON capital_deals(sponsor_profile_id);
CREATE INDEX IF NOT EXISTS idx_capital_deals_published_at
  ON capital_deals(published_at)
  WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_deals_sectors
  ON capital_deals USING GIN (sectors);

CREATE INDEX IF NOT EXISTS idx_capital_deal_documents_deal_sort
  ON capital_deal_documents(deal_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_capital_deal_documents_document_type
  ON capital_deal_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_capital_deal_documents_access_level
  ON capital_deal_documents(access_level);

CREATE INDEX IF NOT EXISTS idx_capital_deal_interests_deal_status
  ON capital_deal_interests(deal_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_deal_interests_member_created
  ON capital_deal_interests(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_deal_interests_status_created
  ON capital_deal_interests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_capital_events_status_starts_at
  ON capital_events(status, starts_at);
CREATE INDEX IF NOT EXISTS idx_capital_events_starts_at
  ON capital_events(starts_at);
CREATE INDEX IF NOT EXISTS idx_capital_events_city
  ON capital_events(city);
CREATE INDEX IF NOT EXISTS idx_capital_events_event_type
  ON capital_events(event_type);
CREATE INDEX IF NOT EXISTS idx_capital_events_published_at
  ON capital_events(published_at)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capital_event_rsvps_member_created
  ON capital_event_rsvps(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_event_rsvps_event_status
  ON capital_event_rsvps(event_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_event_rsvps_status_created
  ON capital_event_rsvps(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_capital_partners_status_featured_sort
  ON capital_partners(status, featured, sort_order);
CREATE INDEX IF NOT EXISTS idx_capital_partners_category_status
  ON capital_partners(category, status);
CREATE INDEX IF NOT EXISTS idx_capital_partners_published_at
  ON capital_partners(published_at)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_capital_partner_intros_partner_status
  ON capital_partner_intros(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_capital_partner_intros_member_created
  ON capital_partner_intros(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_partner_intros_status_created
  ON capital_partner_intros(status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_partner_intros_open_request
  ON capital_partner_intros(partner_id, member_id)
  WHERE status IN ('submitted', 'in_review');

DROP TRIGGER IF EXISTS update_capital_member_profiles_updated_at ON capital_member_profiles;
CREATE TRIGGER update_capital_member_profiles_updated_at
  BEFORE UPDATE ON capital_member_profiles
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_deals_updated_at ON capital_deals;
CREATE TRIGGER update_capital_deals_updated_at
  BEFORE UPDATE ON capital_deals
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_deal_documents_updated_at ON capital_deal_documents;
CREATE TRIGGER update_capital_deal_documents_updated_at
  BEFORE UPDATE ON capital_deal_documents
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_deal_interests_updated_at ON capital_deal_interests;
CREATE TRIGGER update_capital_deal_interests_updated_at
  BEFORE UPDATE ON capital_deal_interests
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_events_updated_at ON capital_events;
CREATE TRIGGER update_capital_events_updated_at
  BEFORE UPDATE ON capital_events
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_event_rsvps_updated_at ON capital_event_rsvps;
CREATE TRIGGER update_capital_event_rsvps_updated_at
  BEFORE UPDATE ON capital_event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_partners_updated_at ON capital_partners;
CREATE TRIGGER update_capital_partners_updated_at
  BEFORE UPDATE ON capital_partners
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_partner_intros_updated_at ON capital_partner_intros;
CREATE TRIGGER update_capital_partner_intros_updated_at
  BEFORE UPDATE ON capital_partner_intros
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

ALTER TABLE capital_member_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_deal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_deal_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_partner_intros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view active capital member profiles"
  ON capital_member_profiles FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND published_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage capital member profiles"
  ON capital_member_profiles FOR ALL
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

CREATE POLICY "Members can view published capital deals"
  ON capital_deals FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND status IN ('open', 'closing', 'closed')
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage capital deals"
  ON capital_deals FOR ALL
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

CREATE POLICY "Members can view member-access deal documents"
  ON capital_deal_documents FOR SELECT
  TO authenticated
  USING (
    access_level = 'members'
    AND EXISTS (
      SELECT 1 FROM capital_deals
      WHERE capital_deals.id = capital_deal_documents.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
    )
  );

CREATE POLICY "Members can view approved-interest deal documents"
  ON capital_deal_documents FOR SELECT
  TO authenticated
  USING (
    access_level = 'approved_interest'
    AND EXISTS (
      SELECT 1 FROM capital_deals
      WHERE capital_deals.id = capital_deal_documents.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
    AND EXISTS (
      SELECT 1 FROM capital_deal_interests
      WHERE capital_deal_interests.deal_id = capital_deal_documents.deal_id
      AND capital_deal_interests.member_id = (select auth.uid())
      AND capital_deal_interests.status IN ('approved', 'intro_scheduled')
    )
  );

CREATE POLICY "Admins can manage capital deal documents"
  ON capital_deal_documents FOR ALL
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

CREATE POLICY "Members can view own capital deal interests"
  ON capital_deal_interests FOR SELECT
  TO authenticated
  USING (member_id = (select auth.uid()));

CREATE POLICY "Members can create own capital deal interests"
  ON capital_deal_interests FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM capital_deals
      WHERE capital_deals.id = capital_deal_interests.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
  );

CREATE POLICY "Admins can manage capital deal interests"
  ON capital_deal_interests FOR ALL
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

CREATE POLICY "Members can view published capital events"
  ON capital_events FOR SELECT
  TO authenticated
  USING (
    published_at IS NOT NULL
    AND status IN ('upcoming', 'completed')
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage capital events"
  ON capital_events FOR ALL
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

CREATE POLICY "Members can view own capital event RSVPs"
  ON capital_event_rsvps FOR SELECT
  TO authenticated
  USING (member_id = (select auth.uid()));

CREATE POLICY "Members can create own capital event RSVPs"
  ON capital_event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM capital_events
      WHERE capital_events.id = capital_event_rsvps.event_id
      AND capital_events.published_at IS NOT NULL
      AND capital_events.status = 'upcoming'
    )
  );

CREATE POLICY "Admins can manage capital event RSVPs"
  ON capital_event_rsvps FOR ALL
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

CREATE POLICY "Members can view active capital partners"
  ON capital_partners FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND published_at IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can manage capital partners"
  ON capital_partners FOR ALL
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

CREATE POLICY "Members can view own capital partner intros"
  ON capital_partner_intros FOR SELECT
  TO authenticated
  USING (member_id = (select auth.uid()));

CREATE POLICY "Members can create own capital partner intros"
  ON capital_partner_intros FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM capital_partners
      WHERE capital_partners.id = capital_partner_intros.partner_id
      AND capital_partners.published_at IS NOT NULL
      AND capital_partners.status = 'active'
    )
  );

CREATE POLICY "Admins can manage capital partner intros"
  ON capital_partner_intros FOR ALL
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
