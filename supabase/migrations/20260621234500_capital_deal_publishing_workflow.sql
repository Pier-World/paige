/*
  # Capital deal publishing workflow

  Adds staff-only import/source-material workflow around capital_deals.
  Member-facing deal visibility remains gated by capital_deals.status + published_at.
*/

CREATE TABLE IF NOT EXISTS public.capital_deal_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL DEFAULT 'manual',
  source_system text,
  source_filename text,
  source_url text,
  status text NOT NULL DEFAULT 'draft',
  source_record_count integer NOT NULL DEFAULT 0,
  imported_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_deal_import_batches_source_type_check CHECK (
    source_type IN ('manual', 'csv', 'json', 'document', 'overview', 'cursor')
  ),
  CONSTRAINT capital_deal_import_batches_status_check CHECK (
    status IN ('draft', 'processing', 'imported', 'failed')
  ),
  CONSTRAINT capital_deal_import_batches_counts_check CHECK (
    source_record_count >= 0 AND imported_count >= 0 AND failed_count >= 0
  ),
  CONSTRAINT capital_deal_import_batches_validation_errors_check CHECK (
    jsonb_typeof(validation_errors) = 'array'
  )
);

ALTER TABLE public.capital_deals
  ADD COLUMN IF NOT EXISTS source_system text,
  ADD COLUMN IF NOT EXISTS source_record_id text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS import_batch_id uuid REFERENCES public.capital_deal_import_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_imported_at timestamptz,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS generated_summary text,
  ADD COLUMN IF NOT EXISTS disclaimer text,
  ADD COLUMN IF NOT EXISTS offering_type text,
  ADD COLUMN IF NOT EXISTS jurisdiction text,
  ADD COLUMN IF NOT EXISTS eligible_investor_requirements text,
  ADD COLUMN IF NOT EXISTS visibility_tier text NOT NULL DEFAULT 'members',
  ADD COLUMN IF NOT EXISTS unpublished_at timestamptz;

ALTER TABLE public.capital_deals DROP CONSTRAINT IF EXISTS capital_deals_review_status_check;
ALTER TABLE public.capital_deals
  ADD CONSTRAINT capital_deals_review_status_check CHECK (
    review_status IN ('draft', 'generated', 'needs_review', 'approved', 'rejected')
  );

ALTER TABLE public.capital_deals DROP CONSTRAINT IF EXISTS capital_deals_visibility_tier_check;
ALTER TABLE public.capital_deals
  ADD CONSTRAINT capital_deals_visibility_tier_check CHECK (
    visibility_tier IN ('members', 'admin')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_capital_deals_source_record
  ON public.capital_deals(source_system, source_record_id)
  WHERE source_system IS NOT NULL AND source_record_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_capital_deals_review_status
  ON public.capital_deals(review_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_deals_import_batch_id
  ON public.capital_deals(import_batch_id);

CREATE TABLE IF NOT EXISTS public.capital_deal_source_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.capital_deals(id) ON DELETE CASCADE,
  import_batch_id uuid REFERENCES public.capital_deal_import_batches(id) ON DELETE SET NULL,
  label text NOT NULL,
  material_type text NOT NULL DEFAULT 'overview',
  storage_path text,
  external_url text,
  original_filename text,
  mime_type text,
  file_size_bytes bigint,
  extracted_text text,
  generated_summary text,
  review_status text NOT NULL DEFAULT 'draft',
  internal_notes text,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_deal_source_materials_material_type_check CHECK (
    material_type IN ('deck', 'memo', 'tearsheet', 'legal', 'financials', 'overview', 'email', 'data_room', 'other')
  ),
  CONSTRAINT capital_deal_source_materials_review_status_check CHECK (
    review_status IN ('draft', 'generated', 'needs_review', 'approved', 'rejected')
  ),
  CONSTRAINT capital_deal_source_materials_file_size_bytes_check CHECK (
    file_size_bytes IS NULL OR file_size_bytes >= 0
  ),
  CONSTRAINT capital_deal_source_materials_attachment_check CHECK (
    storage_path IS NOT NULL OR external_url IS NOT NULL OR extracted_text IS NOT NULL OR generated_summary IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_capital_deal_source_materials_deal_sort
  ON public.capital_deal_source_materials(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_capital_deal_source_materials_import_batch
  ON public.capital_deal_source_materials(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_capital_deal_source_materials_review_status
  ON public.capital_deal_source_materials(review_status, created_at DESC);

DROP TRIGGER IF EXISTS update_capital_deal_import_batches_updated_at ON public.capital_deal_import_batches;
CREATE TRIGGER update_capital_deal_import_batches_updated_at
  BEFORE UPDATE ON public.capital_deal_import_batches
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

DROP TRIGGER IF EXISTS update_capital_deal_source_materials_updated_at ON public.capital_deal_source_materials;
CREATE TRIGGER update_capital_deal_source_materials_updated_at
  BEFORE UPDATE ON public.capital_deal_source_materials
  FOR EACH ROW
  EXECUTE FUNCTION capital_set_updated_at();

ALTER TABLE public.capital_deal_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capital_deal_source_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage capital deal import batches"
  ON public.capital_deal_import_batches FOR ALL
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

CREATE POLICY "Admins can manage capital deal source materials"
  ON public.capital_deal_source_materials FOR ALL
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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'capital-deal-materials',
  'capital-deal-materials',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, storage.buckets.allowed_mime_types);

DROP POLICY IF EXISTS "Admins can select capital deal materials" ON storage.objects;
CREATE POLICY "Admins can select capital deal materials"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Members can select approved capital deal documents" ON storage.objects;
CREATE POLICY "Members can select approved capital deal documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1
      FROM public.capital_deal_documents documents
      JOIN public.capital_deals deals ON deals.id = documents.deal_id
      WHERE documents.storage_path = storage.objects.name
      AND deals.published_at IS NOT NULL
      AND deals.status IN ('open', 'closing', 'closed')
      AND (
        documents.access_level = 'members'
        OR (
          documents.access_level = 'approved_interest'
          AND EXISTS (
            SELECT 1 FROM public.capital_deal_interests interests
            WHERE interests.deal_id = documents.deal_id
            AND interests.member_id = (select auth.uid())
            AND interests.status IN ('approved', 'intro_scheduled')
          )
        )
      )
      AND EXISTS (
        SELECT 1 FROM members
        WHERE members.id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admins can insert capital deal materials" ON storage.objects;
CREATE POLICY "Admins can insert capital deal materials"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update capital deal materials" ON storage.objects;
CREATE POLICY "Admins can update capital deal materials"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete capital deal materials" ON storage.objects;
CREATE POLICY "Admins can delete capital deal materials"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'capital-deal-materials'
    AND EXISTS (
      SELECT 1 FROM members
      WHERE members.id = (select auth.uid())
      AND members.role = 'admin'
    )
  );

UPDATE public.capital_deals
SET
  status = 'pending',
  published_at = NULL,
  review_status = 'draft',
  unpublished_at = COALESCE(unpublished_at, timezone('utc', now())),
  internal_notes = COALESCE(internal_notes, 'Illustrative seed row retained as an internal draft.')
WHERE slug LIKE 'illustrative-%';
