/*
  PR3 — Member import batches + hashed invite tokens (no mail)

  member_import_batches / member_import_rows log importer runs.
  member_invites stores only a SHA-256 hash of a long-lived welcome token.
  The app never sends email; ops export email + welcome URL from the importer report.

  Default membership on create remains Standard (see handle_new_auth_user).
  Tokens expire in 14 days. Do not consume until successful login.

  What could go wrong:
  - A client GRANT/policy on these tables would expose invite hashes or emails.
  - Reusing a raw token in logs/chat would let anyone request OTP to that inbox.
  - Rolling back a batch after the person has signed in deletes their auth user.

  Rollback:
    DROP FUNCTION IF EXISTS public.validate_member_invite(text);
    DROP FUNCTION IF EXISTS public.consume_member_invite(text);
    DROP FUNCTION IF EXISTS public.hash_member_invite_token(text);
    DROP TABLE IF EXISTS public.member_invites;
    DROP TABLE IF EXISTS public.member_import_rows;
    DROP TABLE IF EXISTS public.member_import_batches;
*/

CREATE TABLE IF NOT EXISTS public.member_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_filename text,
  source_record_count integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  skipped_existing_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  dry_run boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'dry_run',
  notes text,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_import_batches_status_check CHECK (
    status IN ('dry_run', 'processing', 'imported', 'failed', 'rolled_back')
  ),
  CONSTRAINT member_import_batches_counts_check CHECK (
    source_record_count >= 0
    AND created_count >= 0
    AND skipped_existing_count >= 0
    AND failed_count >= 0
  )
);

CREATE TABLE IF NOT EXISTS public.member_import_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.member_import_batches(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  email text NOT NULL,
  normalized_email text NOT NULL,
  action text NOT NULL,
  auth_user_id uuid,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  error text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_import_rows_action_check CHECK (
    action IN ('created', 'skipped_existing', 'failed', 'rejected', 'would_create')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_import_rows_batch_email
  ON public.member_import_rows (batch_id, normalized_email);

CREATE INDEX IF NOT EXISTS idx_member_import_rows_batch_action
  ON public.member_import_rows (batch_id, action);

CREATE TABLE IF NOT EXISTS public.member_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.member_import_batches(id) ON DELETE SET NULL,
  email text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  invite_email_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_invites_token_hash_key UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_member_invites_member_id ON public.member_invites (member_id);
CREATE INDEX IF NOT EXISTS idx_member_invites_batch_id ON public.member_invites (batch_id);

ALTER TABLE public.member_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.hash_member_invite_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT encode(extensions.digest(convert_to(trim(p_token), 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.validate_member_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash text;
  v_invite public.member_invites%ROWTYPE;
  v_first text;
BEGIN
  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  v_hash := public.hash_member_invite_token(p_token);

  SELECT * INTO v_invite
  FROM public.member_invites
  WHERE token_hash = v_hash
    AND consumed_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  SELECT first_name INTO v_first
  FROM public.members
  WHERE id = v_invite.member_id;

  RETURN jsonb_build_object(
    'valid', true,
    'email', v_invite.email,
    'first_name', v_first
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_member_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_hash text;
  v_updated integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('consumed', false);
  END IF;

  IF p_token IS NULL OR btrim(p_token) = '' THEN
    RETURN jsonb_build_object('consumed', false);
  END IF;

  v_hash := public.hash_member_invite_token(p_token);

  UPDATE public.member_invites
  SET consumed_at = now()
  WHERE token_hash = v_hash
    AND member_id = auth.uid()
    AND consumed_at IS NULL
    AND expires_at > now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN jsonb_build_object('consumed', v_updated > 0);
END;
$$;

REVOKE ALL ON FUNCTION public.hash_member_invite_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_member_invite(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_member_invite(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.validate_member_invite(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_member_invite(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.hash_member_invite_token(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_member_invite(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_member_invite(text) TO service_role;

REVOKE ALL ON TABLE public.member_import_batches FROM anon, authenticated;
REVOKE ALL ON TABLE public.member_import_rows FROM anon, authenticated;
REVOKE ALL ON TABLE public.member_invites FROM anon, authenticated;
GRANT ALL ON TABLE public.member_import_batches TO service_role;
GRANT ALL ON TABLE public.member_import_rows TO service_role;
GRANT ALL ON TABLE public.member_invites TO service_role;
