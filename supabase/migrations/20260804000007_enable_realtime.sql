-- ============================================================
-- M08: enable Supabase Realtime broadcast for the tables the live
-- match center needs to react to. Explicit opt-in per table rather
-- than relying on a default "publish everything" behavior.
-- ============================================================

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.match_events;
