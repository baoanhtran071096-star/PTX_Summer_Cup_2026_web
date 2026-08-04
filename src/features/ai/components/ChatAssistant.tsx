'use client';

import { useActionState, useState } from 'react';
import { askAssistantAction, type ChatState } from '../actions';
import { AIAnalysisCard } from './AIAnalysisCard';

const initialState: ChatState = { history: [], error: null };

export function ChatAssistant() {
  const [state, formAction, pending] = useActionState(askAssistantAction, initialState);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'var(--ptx-space-6)',
          right: 'var(--ptx-space-6)',
          background: 'var(--ai-accent)',
          color: 'var(--ptx-white)',
          border: 'none',
          borderRadius: 'var(--ptx-radius-pill)',
          padding: 'var(--ptx-space-3) var(--ptx-space-4)',
          cursor: 'pointer',
          boxShadow: 'var(--ptx-shadow-elevated)',
        }}
      >
        🤖 Trợ lý AI
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'var(--ptx-space-6)',
        right: 'var(--ptx-space-6)',
        width: '320px',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--ptx-shadow-elevated)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ptx-space-3)', background: 'var(--ai-accent)', color: 'var(--ptx-white)' }}>
        <span>🤖 Trợ lý AI PTX</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
          ✕
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--ptx-space-3)', display: 'grid', gap: 'var(--ptx-space-2)' }}>
        {state.history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Hỏi tôi về bảng xếp hạng, vua phá lưới, hoặc lịch thi đấu.
          </p>
        ) : null}
        {state.history.map((message, i) =>
          message.role === 'assistant' ? (
            <AIAnalysisCard key={i}>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{message.content}</p>
            </AIAnalysisCard>
          ) : (
            <p key={i} style={{ margin: 0, textAlign: 'right', fontSize: '0.9rem' }}>
              {message.content}
            </p>
          )
        )}
        {state.error ? <p style={{ color: 'var(--status-danger)', fontSize: '0.9rem' }}>{state.error}</p> : null}
      </div>

      <form action={formAction} style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
        <input
          name="question"
          required
          placeholder="Nhập câu hỏi…"
          style={{ flex: 1, border: 'none', padding: 'var(--ptx-space-3)' }}
        />
        <button type="submit" disabled={pending} style={{ border: 'none', background: 'var(--ai-accent)', color: 'var(--ptx-white)', padding: '0 var(--ptx-space-4)' }}>
          {pending ? '…' : 'Gửi'}
        </button>
      </form>
    </div>
  );
}
