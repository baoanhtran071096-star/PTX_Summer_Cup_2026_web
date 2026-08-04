export function PlayerRating({ rating }: { rating: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.5rem',
        height: '2.5rem',
        borderRadius: '50%',
        background: 'var(--prestige-accent)',
        color: 'var(--text-on-prestige-accent)',
        fontWeight: 700,
        fontFamily: 'var(--ptx-font-title)',
      }}
      title="Chỉ số phong độ (tính từ bàn thắng, kiến tạo, MVP)"
    >
      {rating}
    </span>
  );
}
