-- ============================================================
-- M11: Admin Control Center audit trail.
-- ============================================================

create table public.audit_log (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles (id),
    action text not null,
    entity_type text not null,
    entity_id text,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);

alter table public.audit_log enable row level security;

create policy "audit_log: admin read" on public.audit_log for select using (public.is_admin());
create policy "audit_log: admin insert" on public.audit_log for insert with check (public.is_admin());
