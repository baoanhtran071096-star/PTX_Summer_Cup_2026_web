-- ============================================================
-- M04: legacy PLAYERS_DATA tracked a per-match "mvp" counter
-- (docs/legacy/r25-data-inventory.md §1.2) that M01's match_events
-- event_type enum omitted. Adding it now rather than fabricating an
-- mvpCount stat with no schema backing.
-- ============================================================

alter table public.match_events
    drop constraint match_events_event_type_check;

alter table public.match_events
    add constraint match_events_event_type_check
    check (event_type in ('goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'mvp'));

drop view public.v_player_stats;

create view public.v_player_stats as
select
    p.id as player_id,
    coalesce(count(*) filter (where e.event_type = 'goal'), 0) as goals,
    coalesce(count(*) filter (where e.event_type = 'assist'), 0) as assists,
    coalesce(count(*) filter (where e.event_type = 'yellow_card'), 0) as yellow_cards,
    coalesce(count(*) filter (where e.event_type = 'red_card'), 0) as red_cards,
    coalesce(count(*) filter (where e.event_type = 'mvp'), 0) as mvp_count
from public.players p
left join public.match_events e on e.player_id = p.id
group by p.id;
