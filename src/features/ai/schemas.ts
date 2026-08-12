import { z } from '@/lib/validation';

export const askAssistantSchema = z.object({
  question: z.string().trim().min(1, 'Vui lòng nhập câu hỏi.').max(500, 'Câu hỏi quá dài (tối đa 500 ký tự).'),
});
