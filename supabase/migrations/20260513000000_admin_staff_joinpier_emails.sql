-- Grant admin role in public.members for Pier staff emails.
-- 1) Promote existing member rows.
-- 2) If an auth user exists for these emails but no members row yet, insert a minimal admin row.

UPDATE public.members
SET
  role = 'admin',
  updated_at = now()
WHERE lower(btrim(email)) IN (
  'spencer@joinpier.com',
  'hello@joinpier.com'
);

INSERT INTO public.members (
  id,
  first_name,
  last_name,
  email,
  role,
  member_id,
  membership_level,
  onboarding_completed
)
SELECT
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data->>'first_name'), ''), split_part(u.email, '@', 1)),
  coalesce(nullif(trim(u.raw_user_meta_data->>'last_name'), ''), 'Team'),
  u.email,
  'admin',
  'PIER-' || substr(replace(u.id::text, '-', ''), 1, 12),
  'Executive',
  true
FROM auth.users u
WHERE lower(u.email) IN (
  'spencer@joinpier.com',
  'hello@joinpier.com'
)
  AND NOT EXISTS (SELECT 1 FROM public.members m WHERE m.id = u.id)
ON CONFLICT (id) DO UPDATE
SET
  role = 'admin',
  updated_at = now();
