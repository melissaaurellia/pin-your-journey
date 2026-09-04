// Small hand-drawn ornaments for the old-map / postcard look.

import pushpinAsset from "@/assets/pushpin.png.asset.json";
import bulldogClipAsset from "@/assets/bulldog-clip.png.asset.json";
import safetyPinAsset from "@/assets/safety-pin.png.asset.json";

export type AttachmentVariant = "pin" | "clip" | "safety" | "tape";

const ATTACHMENT_VARIANTS: AttachmentVariant[] = ["pin", "clip", "safety", "tape"];

/** Pick an attachment style deterministically from a string (e.g. a place id). */
export function attachmentFor(key: string): AttachmentVariant {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ATTACHMENT_VARIANTS[hash % ATTACHMENT_VARIANTS.length];
}

/**
 * A physical-looking fastener holding a photo down: red pushpin, bulldog clip,
 * safety pin, or a strip of masking tape. Render inside a `relative` wrapper
 * around the photo.
 */
export function PhotoAttachment({ variant }: { variant: AttachmentVariant }) {
  switch (variant) {
    case "pin":
      return (
        <img
          src={pushpinAsset.url}
          alt=""
          aria-hidden="true"
          className="absolute -top-5 left-1/2 z-10 w-9 -translate-x-1/2 -rotate-6 drop-shadow-[2px_3px_2px_oklch(0.25_0.04_55/0.45)]"
          draggable={false}
        />
      );
    case "clip":
      return (
        <img
          src={bulldogClipAsset.url}
          alt=""
          aria-hidden="true"
          className="absolute -top-4 left-1/2 z-10 w-12 -translate-x-1/2 rotate-2 drop-shadow-[2px_3px_2px_oklch(0.25_0.04_55/0.4)]"
          draggable={false}
        />
      );
    case "safety":
      return (
        <img
          src={safetyPinAsset.url}
          alt=""
          aria-hidden="true"
          className="absolute -left-3 -top-2 z-10 w-14 -rotate-45 drop-shadow-[2px_2px_2px_oklch(0.25_0.04_55/0.4)]"
          draggable={false}
        />
      );
    case "tape":
      return (
        <span
          aria-hidden="true"
          className="masking-tape absolute -top-2.5 left-1/2 z-10 h-5 w-16 -translate-x-1/2 -rotate-3"
        />
      );
  }
}

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
