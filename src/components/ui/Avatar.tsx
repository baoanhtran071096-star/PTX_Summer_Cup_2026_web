import Image from 'next/image';

/** Falls back to an initial-letter badge when no media has been uploaded yet (pre-M09-upload state). */
export function Avatar({ src, name, size = 48 }: { src: string | null; name: string; size?: number }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--surface-page)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--ptx-font-title)',
      }}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
