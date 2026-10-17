// The CampusAI logo: a book (study) with a spark (AI)
export default function Logo({ size = 48, showName = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="CampusAI logo"
      >
        <rect width="64" height="64" rx="16" fill="#2563EB" />
        {/* The spark */}
        <path
          d="M32 7 L34 12.5 L39.5 14.5 L34 16.5 L32 22 L30 16.5 L24.5 14.5 L30 12.5 Z"
          fill="#DBEAFE"
        />
        {/* The open book */}
        <path d="M13 45 C19 41.5 26 41.5 32 45 L32 29 C26 25.5 19 25.5 13 29 Z" fill="#FFFFFF" />
        <path d="M51 45 C45 41.5 38 41.5 32 45 L32 29 C38 25.5 45 25.5 51 29 Z" fill="#FFFFFF" />
        <line x1="32" y1="29" x2="32" y2="45" stroke="#2563EB" strokeWidth="1.6" />
        <path
          d="M13 49.5 C19 46 26 46 32 49.5 C38 46 45 46 51 49.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showName && (
        <span style={{ fontSize: size * 0.5, fontWeight: 'bold', color: 'var(--color-primary)' }}>
          CampusAI
        </span>
      )}
    </span>
  );
}