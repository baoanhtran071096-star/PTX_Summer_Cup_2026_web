/** Pure TypeScript — no React/Next.js/Supabase/browser APIs (Architecture v1.3 §3). */

export type TeamAttributes = {
  attack: number;
  defense: number;
  speed: number;
  power: number;
};

export type Team = {
  id: string;
  name: string;
  fullName: string;
  icon: string | null;
  color: string;
  captainName: string | null;
  stats: TeamAttributes;
  ovr: number;
  logoPath: string | null;
};
