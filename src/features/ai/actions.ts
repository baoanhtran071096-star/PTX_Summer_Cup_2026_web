'use server';

import { generateAiResponse } from '@/services/ai/provider';
import { buildTournamentContext } from './context';
import { askAssistantSchema } from './schemas';

export type ChatState = {
  history: { role: 'user' | 'assistant'; content: string }[];
  error: string | null;
};

export async function askAssistantAction(prevState: ChatState, formData: FormData): Promise<ChatState> {
  const parsed = askAssistantSchema.safeParse({ question: formData.get('question') });
  if (!parsed.success) {
    return { ...prevState, error: parsed.error.issues[0]?.message ?? 'Vui lòng nhập câu hỏi.' };
  }

  const context = await buildTournamentContext();

  try {
    const answer = await generateAiResponse([
      { role: 'system', content: context },
      { role: 'user', content: parsed.data.question },
    ]);

    return {
      history: [
        ...prevState.history,
        { role: 'user', content: parsed.data.question },
        { role: 'assistant', content: answer },
      ],
      error: null,
    };
  } catch (err) {
    return { ...prevState, error: err instanceof Error ? err.message : 'AI trợ lý gặp lỗi.' };
  }
}
