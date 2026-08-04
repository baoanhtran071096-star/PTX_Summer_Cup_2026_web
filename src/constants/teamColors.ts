/**
 * Maps a team's legacy id to its semantic color token (never a raw hex
 * value in component code — Architecture v1.3 §14). The actual hex
 * values live only in design-system/semantic/sports.css.
 */
const TEAM_COLOR_VARS: Record<string, string> = {
  p: 'var(--team-color-p)',
  t: 'var(--team-color-t)',
  x: 'var(--team-color-x)',
};

export function getTeamColorVar(teamId: string): string {
  return TEAM_COLOR_VARS[teamId] ?? 'var(--interactive-secondary)';
}

/**
 * Text-safe variant of a team's color — use for text/foreground, never
 * for borders/accents (those should keep `getTeamColorVar`'s true brand
 * color). Only Xiphias needs remapping; see sports.css for why.
 */
const TEAM_TEXT_COLOR_VARS: Record<string, string> = {
  p: 'var(--team-color-p)',
  t: 'var(--team-color-t)',
  x: 'var(--text-on-team-x)',
};

export function getTeamTextColorVar(teamId: string): string {
  return TEAM_TEXT_COLOR_VARS[teamId] ?? 'var(--interactive-secondary)';
}
