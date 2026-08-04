import { z } from '@/lib/validation';

export const recordMatchEventSchema = z.object({
  matchId: z.string().uuid(),
  teamId: z.string().min(1),
  playerId: z.string().uuid().nullable(),
  eventType: z.enum(['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'mvp']),
  minute: z.number().int().min(0).max(120),
});

export const setMatchStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed']),
});
