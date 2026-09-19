interface AuxtraLogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: number;
  markOnly?: boolean;
}

/** Auxtra Bank logo — AB monogram + wordmark (Safe · Simple · Smart) */
export function AuxtraLogo({
  className = '',
  showWordmark = true,
  size = 32,
  markOnly = false,
}: AuxtraLogoProps) {
  const showText = showWordmark && !markOnly;
  const gid = `aux-${size}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${gid}-g`} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
            <stop stopColor="#7DD3FC" />
            <stop offset="0.35" stopColor="#3B82F6" />
            <stop offset="1" stopColor="#1E40AF" />
          </linearGradient>
          <linearGradient id={`${gid}-c`} x1="5" y1="80" x2="95" y2="55" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#2563EB" />
          </linearGradient>
        </defs>
        {/* A */}
        <path
          d="M8 78 L28 18 H38 L58 78 H48 L43 62 H23 L18 78 H8 Z M25.5 52 H40.5 L33 28 L25.5 52 Z"
          fill={`url(#${gid}-g)`}
        />
        {/* B */}
        <path
          d="M58 18 H74 C84 18 90 26 90 36 C90 43 86 48 80 50 C87 52 92 58 92 66 C92 76 85 82 74 82 H58 V18 Z M66 26 V46 H74 C79 46 82 42 82 37 C82 31 79 26 74 26 H66 Z M66 54 V72 H75 C81 72 84 68 84 63 C84 58 81 54 75 54 H66 Z"
          fill={`url(#${gid}-g)`}
        />
        {/* Swoosh */}
        <path
          d="M6 72 Q50 92 96 58"
          stroke={`url(#${gid}-c)`}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showText && (
        <span className="flex flex-col leading-none select-none">
          <span
            className="font-bold uppercase text-blue-400"
            style={{ letterSpacing: '0.14em', fontSize: '0.92em' }}
          >
            Auxtra
          </span>
          <span
            className="font-semibold uppercase text-blue-500/90"
            style={{ letterSpacing: '0.32em', fontSize: '0.68em', marginTop: 3 }}
          >
            Bank
          </span>
        </span>
      )}
    </div>
  );
}

export { AuxtraLogo as WestbridgeLogo };
