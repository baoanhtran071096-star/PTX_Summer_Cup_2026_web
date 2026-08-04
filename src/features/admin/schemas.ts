import { z } from '@/lib/validation';

export const updateTournamentSettingsSchema = z.object({
  slogan: z.string().trim().max(200),
  message: z.string().trim().max(500),
  eventDate: z.string().trim().max(50),
  location: z.string().trim().max(300),
});

export const updateTeamSchema = z.object({
  teamId: z.string().min(1),
  captainName: z.string().trim().max(100),
  attack: z.coerce.number().int().min(0).max(99),
  defense: z.coerce.number().int().min(0).max(99),
  speed: z.coerce.number().int().min(0).max(99),
  power: z.coerce.number().int().min(0).max(99),
});

export const updatePlayerSchema = z.object({
  playerId: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  teamId: z.string().min(1),
  position: z.enum(['FW', 'MF', 'DF', 'GK']),
});

export const deletePredictionSchema = z.object({
  predictionId: z.string().uuid(),
});

export const updateUserRoleSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['admin', 'viewer']),
});

export const uploadMediaSchema = z.object({
  bucket: z.enum(['team-logos', 'player-avatars', 'gallery', 'operations-media', 'branding']),
  targetKey: z.string().trim().min(1).max(200),
});
