/*
  Unlock approved_interest deal documents (including outbound data-room URLs)
  as soon as a member submits interest, not only after staff approval.
*/

DROP POLICY IF EXISTS "Members can view approved-interest deal documents" ON public.capital_deal_documents;
CREATE POLICY "Members can view approved-interest deal documents"
  ON public.capital_deal_documents FOR SELECT
  TO authenticated
  USING (
    access_level = 'approved_interest'
    AND public.is_pier_plus()
    AND EXISTS (
      SELECT 1 FROM public.capital_deals
      WHERE capital_deals.id = capital_deal_documents.deal_id
      AND capital_deals.published_at IS NOT NULL
      AND capital_deals.status IN ('open', 'closing', 'closed')
    )
    AND EXISTS (
      SELECT 1 FROM public.capital_deal_interests
      WHERE capital_deal_interests.deal_id = capital_deal_documents.deal_id
      AND capital_deal_interests.member_id = (SELECT auth.uid())
      AND capital_deal_interests.status IN ('submitted', 'under_review', 'approved', 'intro_scheduled')
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
            AND interests.member_id = (SELECT auth.uid())
            AND interests.status IN ('submitted', 'under_review', 'approved', 'intro_scheduled')
          )
        )
      )
      AND EXISTS (
        SELECT 1 FROM members
        WHERE members.id = (SELECT auth.uid())
      )
    )
  );
