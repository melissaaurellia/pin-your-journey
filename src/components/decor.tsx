// Small hand-drawn ornaments for the old-map / postcard look.

export function Paperclip({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 64"
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M19.5 15.5v27.8c0 5.2-3.6 9.2-8 9.2s-8-4-8-9.2V13.6C3.5 7.2 8 2.5 13.9 2.5S24.3 7.2 24.3 13.6v30.9c0 8.6-6.1 15.4-14 15.4"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
