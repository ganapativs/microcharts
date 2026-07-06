/**
 * microcharts brand mark — a rising signal that breaks its frame, ending in an
 * open node. Reads as growth/data at any size, works on any background. Uses
 * currentColor for the frame so it inherits (mono-safe); the stroke is the
 * surface color punched through.
 *
 * variant "solid"  → filled squircle in the accent, mark knocked out (favicons,
 *                     tab, wordmark badge).
 * variant "line"   → transparent, drawn in currentColor (footers, watermarks).
 */
export function Brandmark({
  size = 24,
  variant = "solid",
  className,
}: {
  size?: number;
  variant?: "solid" | "line";
  className?: string;
}) {
  if (variant === "line") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className={className}
      >
        <path
          d="M6 23.5L13 16L18.5 18.5L25.5 8"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="25.5" cy="8" r="3.1" stroke="currentColor" strokeWidth="2.2" fill="none" />
      </svg>
    );
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* squircle */}
      <path
        d="M16 1.2c6.7 0 8.9.3 11 2.4s2.4 4.3 2.4 11 -.3 8.9 -2.4 11 -4.3 2.4 -11 2.4 -8.9 -.3 -11 -2.4 -2.4 -4.3 -2.4 -11 .3 -8.9 2.4 -11S9.3 1.2 16 1.2Z"
        className="fill-fd-primary"
      />
      {/* rising signal, knocked out in the surface color */}
      <path
        d="M6.5 22.5L13 15.5L18.5 18L25 8.5"
        className="stroke-fd-primary-foreground"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* open node */}
      <circle
        cx="25"
        cy="8.5"
        r="2.9"
        className="stroke-fd-primary-foreground fill-fd-primary"
        strokeWidth="2"
      />
    </svg>
  );
}
