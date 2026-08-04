import { isAiConfigured } from '@/lib/env';
import { ChatAssistant } from './ChatAssistant';

/**
 * Server Component gate: AI_PROVIDER_API_KEY is server-only (correctly
 * never inlined into the client bundle), so "is AI configured" can
 * only be checked here, not inside the client ChatAssistant itself.
 * Renders nothing when unconfigured — the rest of the site must work
 * fully without AI either way (docs/architecture §15).
 */
export function AIAssistantWidget() {
  if (!isAiConfigured()) return null;
  return <ChatAssistant />;
}
