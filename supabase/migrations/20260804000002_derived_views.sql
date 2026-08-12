-- ============================================================
-- Derived aggregate views — always recomputed from match_events,
-- never independently stored/edited (docs/architecture §6, extended
-- to player/match stats per r25-data-reconciliation-plan.md §3).
--
-- Standings/ranking RULES (points, tiebreakers) are intentionally
-- NOT computed here — those are business rules and belong in
-- src/domain/standings/ranking-rules.ts (Pure TypeScript), consuming
-- these views' raw per-match scores as input. This file only
-- provides simple, rule-free aggregations (a goal is a goal).
-- ============================================================

create view public.v_match_scores as
select
    m.id as match_id,
    coalesce(sum(case when e.team_id = m.home_team_id and e.event_type = 'goal' then 1
                      when e.team_id = m.away_team_id and e.event_type = 'own_goal' then 1
                      else 0 end), 0) as home_score,
    coalesce(sum(case when e.team_id = m.away_team_id and e.event_type = 'goal' then 1
                      when e.team_id = m.home_team_id and e.event_type = 'own_goal' then 1
                      else 0 end), 0) as away_score
from public.matches m
left join public.match_events e on e.match_id = m.id
group by m.id;

create view public.v_player_stats as
select
    p.id as player_id,
    coalesce(count(*) filter (where e.event_type = 'goal'), 0) as goals,
    coalesce(count(*) filter (where e.event_type = 'assist'), 0) as assists,
    coalesce(count(*) filter (where e.event_type = 'yellow_card'), 0) as yellow_cards,
    coalesce(count(*) filter (where e.event_type = 'red_card'), 0) as red_cards
from public.players p
left join public.match_events e on e.player_id = p.id
group by p.id;
