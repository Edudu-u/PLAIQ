import { useId } from "react";

type BrandLogoProps = {
  className?: string;
  title?: string;
};

/** Canonical PLAYQ.GG mark — Q + eye + upward arrow, theme-colored via --logo-a/--logo-b */
export function BrandLogo({
  className = "brand-logo",
  title = "PLAYQ.GG",
}: BrandLogoProps) {
  const gradId = `playqLogoGrad-${useId().replace(/:/g, "")}`;

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
          <stop offset="0%" stopColor="var(--logo-a, #7bf5fd)" />
          <stop offset="100%" stopColor="var(--logo-b, #b8ff4a)" />
        </linearGradient>
      </defs>

      <circle
        cx="31"
        cy="33"
        r="20.5"
        stroke={`url(#${gradId})`}
        strokeWidth="5.2"
      />
      <path
        d="M42.5 47.5 55.5 58"
        stroke={`url(#${gradId})`}
        strokeWidth="5.2"
        strokeLinecap="round"
      />
      <path
        d="M18.8 34c4.6-6.4 8.8-9.4 12.2-9.4s7.6 3 12.2 9.4c-4.6 6.4-8.8 9.4-12.2 9.4S23.4 40.4 18.8 34Z"
        stroke={`url(#${gradId})`}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M31 38.5V12.5"
        stroke={`url(#${gradId})`}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M31 5.2 24.6 15.2h12.8L31 5.2Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
