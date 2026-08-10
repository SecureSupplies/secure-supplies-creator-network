/**
 * Original text-based Secure Supplies wordmark (SVG).
 * Purpose-built for this project — not copied from any other company.
 */
export function Wordmark({ height = 34 }: { height?: number }) {
  return (
    <svg
      height={height}
      viewBox="0 0 232 44"
      role="img"
      aria-label="Secure Supplies Creator Partner Network"
    >
      <defs>
        <linearGradient id="ssg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--ss-cyan)" />
          <stop offset="100%" stopColor="var(--ss-green)" />
        </linearGradient>
      </defs>
      {/* H2 molecule + coil motif */}
      <circle cx="16" cy="16" r="7" fill="none" stroke="url(#ssg)" strokeWidth="2.5" />
      <circle cx="30" cy="28" r="7" fill="none" stroke="url(#ssg)" strokeWidth="2.5" />
      <line x1="21" y1="20.5" x2="25" y2="23.5" stroke="url(#ssg)" strokeWidth="2.5" />
      <path
        d="M40 32 q3 -8 6 0 t6 0 t6 0"
        fill="none"
        stroke="var(--ss-steel-300)"
        strokeWidth="2"
      />
      <text
        x="64"
        y="20"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="15"
        fontWeight="800"
        letterSpacing="1.5"
        fill="var(--ss-offwhite)"
      >
        SECURE SUPPLIES
      </text>
      <text
        x="64"
        y="36"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="8.5"
        fontWeight="600"
        letterSpacing="1.4"
        fill="var(--ss-cyan)"
      >
        CREATOR PARTNER NETWORK
      </text>
    </svg>
  )
}
