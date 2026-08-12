-- ============================================================
-- M09: storage.objects RLS. Buckets are public-read (set via
-- storage.buckets.*.public = true in config.toml / dashboard), but
-- `public` only affects unauthenticated SELECT — writes still need
-- explicit RLS policies, or any authenticated user could upload.
-- ============================================================

create policy "media buckets: admin write"
on storage.objects for insert
with check (
    bucket_id in ('team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding')
    and public.is_admin()
);

create policy "media buckets: admin update"
on storage.objects for update
using (
    bucket_id in ('team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding')
    and public.is_admin()
);

create policy "media buckets: admin delete"
on storage.objects for delete
using (
    bucket_id in ('team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding')
    and public.is_admin()
);
