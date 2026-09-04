// Small hand-drawn ornaments for the old-map / postcard look.

export function Paperclip({ className = "" }: { className?: string }) {
  const id = "clip-metal";
  return (
    <svg
      viewBox="0 0 28 64"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6f7176" />
          <stop offset="28%" stopColor="#d7dadd" />
          <stop offset="48%" stopColor="#fbfcfd" />
          <stop offset="70%" stopColor="#9ea2a7" />
          <stop offset="100%" stopColor="#5f6266" />
        </linearGradient>
        <filter id="clip-shadow" x="-60%" y="-30%" width="220%" height="180%">
          <feDropShadow dx="1.2" dy="2" stdDeviation="1.4" floodColor="#2c241c" floodOpacity="0.45" />
        </filter>
      </defs>
      <g filter="url(#clip-shadow)">
        <path
          d="M19.5 15.5v27.8c0 5.2-3.6 9.2-8 9.2s-8-4-8-9.2V13.6C3.5 7.2 8 2.5 13.9 2.5S24.3 7.2 24.3 13.6v30.9c0 8.6-6.1 15.4-14 15.4"
          stroke={`url(#${id})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 15.5v27.8c0 5.2-3.6 9.2-8 9.2s-8-4-8-9.2V13.6C3.5 7.2 8 2.5 13.9 2.5S24.3 7.2 24.3 13.6v30.9c0 8.6-6.1 15.4-14 15.4"
          stroke="#3a3d41"
          strokeWidth="0.5"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function CompassRose({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth="1.4" fill="none">
        <circle cx="32" cy="32" r="26" />
        <circle cx="32" cy="32" r="19" strokeDasharray="2 4" />
      </g>
      <path d="M32 4 36 30 32 60 28 30Z" fill="currentColor" opacity="0.85" />
      <path d="M4 32 30 28 60 32 30 36Z" fill="currentColor" opacity="0.45" />
      <circle cx="32" cy="32" r="3" fill="currentColor" />
    </svg>
  );
}

export function Stamp({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-flex items-center justify-center border-2 border-dotted border-primary/50 bg-secondary px-2.5 py-1 ${className}`}
    >
      {children}
    </span>
  );
}
