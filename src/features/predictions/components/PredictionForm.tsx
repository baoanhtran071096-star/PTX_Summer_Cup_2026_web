'use client';

import { useActionState, useState } from 'react';
import { submitPredictionAction, type SubmitPredictionState } from '../actions';

type MatchOption = { legacyId: number; homeTeamName: string; awayTeamName: string };
type PlayerOption = { id: string; name: string };

const initialState: SubmitPredictionState = { error: null, ticketCode: null };

export function PredictionForm({ matches, players }: { matches: MatchOption[]; players: PlayerOption[] }) {
  const [state, formAction, pending] = useActionState(submitPredictionAction, initialState);
  const [picks, setPicks] = useState<Record<string, { homeScore: number; awayScore: number }>>({});

  function updatePick(legacyId: number, field: 'homeScore' | 'awayScore', value: number) {
    setPicks((prev) => ({
      ...prev,
      [legacyId]: { homeScore: 0, awayScore: 0, ...prev[legacyId], [field]: value },
    }));
  }

  if (state.ticketCode) {
    return (
      <div>
        <p>Đã gửi dự đoán! Mã vé của bạn:</p>
        <p style={{ fontFamily: 'var(--ptx-font-title)', fontSize: '1.5rem' }}>{state.ticketCode}</p>
        <p style={{ color: 'var(--text-muted)' }}>Lưu lại mã này để tra cứu kết quả sau.</p>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: 'grid', gap: 'var(--ptx-space-4)', maxWidth: '480px' }}>
      <label>
        Tên của bạn
        <input name="displayName" required style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }} />
      </label>

      {matches.map((match) => (
        <fieldset key={match.legacyId} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--ptx-radius-sm)' }}>
          <legend>
            {match.homeTeamName} vs {match.awayTeamName}
          </legend>
          <input
            type="number"
            min={0}
            max={50}
            aria-label={`Tỉ số ${match.homeTeamName}`}
            onChange={(e) => updatePick(match.legacyId, 'homeScore', Number(e.target.value))}
            style={{ width: '4rem' }}
          />
          {' : '}
          <input
            type="number"
            min={0}
            max={50}
            aria-label={`Tỉ số ${match.awayTeamName}`}
            onChange={(e) => updatePick(match.legacyId, 'awayScore', Number(e.target.value))}
            style={{ width: '4rem' }}
          />
        </fieldset>
      ))}

      <label>
        Cầu thủ xuất sắc nhất (MVP)
        <select name="mvpPlayerId" style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }}>
          <option value="">-- Chọn --</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Vua phá lưới
        <select name="goldenBootPlayerId" style={{ display: 'block', width: '100%', padding: 'var(--ptx-space-2)' }}>
          <option value="">-- Chọn --</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <input type="hidden" name="picks" value={JSON.stringify(picks)} />

      {state.error ? <p style={{ color: 'var(--status-danger)' }}>{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        style={{
          background: 'var(--interactive-primary)',
          color: 'var(--text-on-interactive-primary)',
          border: 'none',
          borderRadius: 'var(--ptx-radius-sm)',
          padding: 'var(--ptx-space-2) var(--ptx-space-4)',
        }}
      >
        {pending ? 'Đang gửi…' : 'Gửi dự đoán'}
      </button>
    </form>
  );
}
