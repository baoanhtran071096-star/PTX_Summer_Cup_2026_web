import { describe, it, expect } from 'vitest';
import { askAssistantSchema } from '@/features/ai/schemas';

describe('askAssistantSchema', () => {
  it('accepts a normal question', () => {
    expect(askAssistantSchema.safeParse({ question: 'Đội nào đang dẫn đầu?' }).success).toBe(true);
  });

  it('rejects an empty question', () => {
    expect(askAssistantSchema.safeParse({ question: '' }).success).toBe(false);
  });

  it('rejects a question over 500 characters', () => {
    expect(askAssistantSchema.safeParse({ question: 'a'.repeat(501) }).success).toBe(false);
  });

  it('trims whitespace-only input to empty and rejects it', () => {
    expect(askAssistantSchema.safeParse({ question: '   ' }).success).toBe(false);
  });
});
