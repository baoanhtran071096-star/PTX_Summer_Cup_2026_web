import { getEnv, isAiConfigured } from '@/lib/env';
import { InfrastructureError } from '@/lib/errors';

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * Provider-agnostic adapter — any endpoint implementing the
 * OpenAI-compatible chat-completions shape works (swap the URL/model,
 * no code change). AI is a capability, never an architecture owner
 * (docs/architecture §15): callers are responsible for putting
 * verified domain data into the prompt — this adapter has no opinion
 * on tournament facts, it only relays text.
 */
export async function generateAiResponse(messages: ChatMessage[]): Promise<string> {
  if (!isAiConfigured()) {
    throw new InfrastructureError('AI provider chưa được cấu hình.');
  }
  const env = getEnv();

  const response = await fetch(env.AI_PROVIDER_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_PROVIDER_MODEL ?? 'default',
      messages,
      temperature: 0.4,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new InfrastructureError(`AI provider trả về lỗi ${response.status}: ${await response.text()}`);
  }

  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new InfrastructureError('AI provider không trả về nội dung hợp lệ.');
  return content;
}
