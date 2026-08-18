import { useId } from "react";

type BrandWordmarkProps = {
  className?: string;
};

/**
 * PLAYQ.GG wordmark with a drawn Q (circle + long tail) so it never
 * collapses into an O under heavy display fonts or glow.
 */
export function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `playqWord-${uid}`;
  const stroke = `url(#${gradId})`;

  return (
    <span className={`brand-wordmark ${className}`.trim()}>
      <span className="brand-wordmark-text">PLAY</span>
      <svg
        className="brand-wordmark-q"
        viewBox="0 0 24 28"
        aria-hidden="true"
        fill="none"
      >
        <defs>
          <linearGradient
            id={gradId}
            x1="2"
            y1="14"
            x2="22"
            y2="14"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--logo-a, #5cefff)" />
            <stop offset="100%" stopColor="var(--logo-b, #7a9dff)" />
          </linearGradient>
        </defs>
        <circle
          cx="11"
          cy="12.2"
          r="8"
          stroke={stroke}
          strokeWidth="2.7"
        />
        <path
          d="M16.4 17.6 22.2 25"
          stroke={stroke}
          strokeWidth="2.7"
          strokeLinecap="round"
        />
      </svg>
      <span className="brand-wordmark-text">.GG</span>
    </span>
  );
}
