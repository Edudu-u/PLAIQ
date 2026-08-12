export function BrandLogo({ className = "brand-logo" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Horizontal cyan → lime like the source PNG; theme vars recolor for Reshiram */}
        <linearGradient
          id="playqLogoGrad"
          x1="8"
          y1="32"
          x2="56"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--logo-a)" />
          <stop offset="100%" stopColor="var(--logo-b)" />
        </linearGradient>
      </defs>

      {/* Q ring — thick circle, open near the diagonal tail */}
      <circle
        cx="31"
        cy="33"
        r="20.5"
        stroke="url(#playqLogoGrad)"
        strokeWidth="5.2"
      />

      {/* Q tail — ~45° from bottom-right */}
      <path
        d="M42.5 47.5 55.5 58"
        stroke="url(#playqLogoGrad)"
        strokeWidth="5.2"
        strokeLinecap="round"
      />

      {/* Eye — almond outline */}
      <path
        d="M18.8 34c4.6-6.4 8.8-9.4 12.2-9.4s7.6 3 12.2 9.4c-4.6 6.4-8.8 9.4-12.2 9.4S23.4 40.4 18.8 34Z"
        stroke="url(#playqLogoGrad)"
        strokeWidth="3.4"
        strokeLinejoin="round"
      />

      {/* Arrow shaft as pupil, piercing upward through the Q */}
      <path
        d="M31 38.5V12.5"
        stroke="url(#playqLogoGrad)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* Arrow head breaking the top of the Q */}
      <path
        d="M31 5.2 24.6 15.2h12.8L31 5.2Z"
        fill="url(#playqLogoGrad)"
      />
    </svg>
  );
}
