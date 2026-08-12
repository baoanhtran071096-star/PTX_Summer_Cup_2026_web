import { z } from '@/lib/validation';

const emptyToNull = z.preprocess((v) => (v === '' ? null : v), z.string().uuid().nullable());

export const recordMatchEventSchema = z.object({
  matchId: z.string().uuid(),
  teamId: z.string().min(1),
  playerId: emptyToNull,
  eventType: z.enum(['goal', 'own_goal', 'assist', 'yellow_card', 'red_card', 'mvp']),
  minute: z.coerce.number().int().min(0).max(120),
});

export const setMatchStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed']),
});
