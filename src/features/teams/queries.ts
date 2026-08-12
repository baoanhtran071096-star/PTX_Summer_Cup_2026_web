import { notFound } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/services/database/client-server';
import { listTeams, getTeamById } from '@/services/database/teams.db';
import { listPlayers } from '@/services/database/players.db';
import { getPublicMediaUrl } from '@/services/storage/media';
import { calculateTeamOvr } from '@/domain/team/rules';
import type { TeamWithSquad, SquadMember } from './types';
import type { PlayerRow, TeamRow } from '@/services/database/types';

function toSquadMember(client: SupabaseClient, p: PlayerRow): SquadMember {
  return {
    id: p.id,
    legacyId: p.legacy_id,
    name: p.name,
    position: p.position,
    avatarPath: p.avatar_path,
    avatarUrl: p.avatar_path ? getPublicMediaUrl(client, 'player-avatars', p.avatar_path) : null,
  };
}

function toTeamWithSquad(client: SupabaseClient, row: TeamRow, squad: SquadMember[]): TeamWithSquad {
  return {
    id: row.id,
    name: row.name,
    fullName: row.full_name,
    icon: row.icon,
    color: row.color,
    captainName: row.captain_name,
    stats: row.stats,
    // Domain-derived, not the raw stored column — see domain/team/rules.ts.
    ovr: calculateTeamOvr(row.stats),
    logoPath: row.logo_path,
    logoUrl: row.logo_path ? getPublicMediaUrl(client, 'team-logos', row.logo_path) : null,
    squad,
  };
}

export async function getAllTeamsWithSquads(): Promise<TeamWithSquad[]> {
  const supabase = await createSupabaseServerClient();
  const [teams, players] = await Promise.all([listTeams(supabase), listPlayers(supabase)]);

  return teams.map((team) =>
    toTeamWithSquad(
      supabase,
      team,
      players.filter((p) => p.team_id === team.id).map((p) => toSquadMember(supabase, p))
    )
  );
}

export async function getTeamBySlug(slug: string): Promise<TeamWithSquad> {
  const supabase = await createSupabaseServerClient();
  const team = await getTeamById(supabase, slug);
  if (!team) notFound();

  const squad = await listPlayers(supabase, slug);
  return toTeamWithSquad(
    supabase,
    team,
    squad.map((p) => toSquadMember(supabase, p))
  );
}
