import { useId } from "react";

type BrandLogoProps = {
  className?: string;
  title?: string;
};

/**
 * PLAYQ.GG brand mark (transparent):
 * stylized Q, almond eye + pupil, arrow from bottom ring through the eye and out the top gap.
 */
export function BrandLogo({
  className = "brand-logo",
  title = "PLAYQ.GG",
}: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `playqGrad-${uid}`;
  const stroke = `url(#${gradId})`;

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient
          id={gradId}
          x1="8"
          y1="32"
          x2="56"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--logo-a, #5cefff)" />
          <stop offset="55%" stopColor="var(--logo-mid, #5bb8ff)" />
          <stop offset="100%" stopColor="var(--logo-b, #7a9dff)" />
        </linearGradient>
      </defs>

      {/* Q ring with top gap for arrowhead */}
      <path
        d="M41.2 15.2A20.5 20.5 0 1 1 22.8 15.2"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="butt"
      />

      {/* Q tail ~45° */}
      <path
        d="M45 49.2 55.6 58.6"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Eye outline — pointed almond */}
      <path
        d="M16.8 34C21 25.6 26.6 21.8 32 21.8S43 25.6 47.2 34C43 42.4 37.4 46.2 32 46.2S21 42.4 16.8 34Z"
        stroke={stroke}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Solid pupil */}
      <circle cx="32" cy="34" r="4.6" fill={stroke} />

      {/* Arrow shaft: bottom of Q → through pupil → top gap */}
      <path
        d="M32 54.5V12"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="butt"
      />

      {/* Arrowhead piercing the top gap */}
      <path d="M32 3.6 24.8 15h14.4L32 3.6Z" fill={stroke} />
    </svg>
  );
}
