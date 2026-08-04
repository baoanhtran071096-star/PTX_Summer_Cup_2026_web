import { z } from '@/lib/validation';

const matchScoreGuess = z.object({
  homeScore: z.number().int().min(0).max(50),
  awayScore: z.number().int().min(0).max(50),
});

export const submitPredictionSchema = z.object({
  displayName: z.string().trim().min(1, 'Vui lòng nhập tên').max(100),
  picks: z.record(z.string(), matchScoreGuess),
  mvpPlayerId: z.string().uuid().nullable(),
  goldenBootPlayerId: z.string().uuid().nullable(),
});

export type SubmitPredictionInput = z.infer<typeof submitPredictionSchema>;
