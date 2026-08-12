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
        <linearGradient
          id="playqLogoGrad"
          x1="8"
          y1="10"
          x2="56"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--logo-a)" />
          <stop offset="100%" stopColor="var(--logo-b)" />
        </linearGradient>
      </defs>

      {/* Q ring — open toward bottom-right */}
      <path
        d="M48.8 45.2A21 21 0 1 0 18.4 49.1"
        stroke="url(#playqLogoGrad)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      {/* Q tail */}
      <path
        d="M44.2 44.8 55.2 55.6"
        stroke="url(#playqLogoGrad)"
        strokeWidth="4.2"
        strokeLinecap="round"
      />

      {/* Eye outline */}
      <path
        d="M20.5 33.2c4.2-5.2 9.4-7.8 11.5-7.8s7.3 2.6 11.5 7.8c-4.2 5.2-9.4 7.8-11.5 7.8s-7.3-2.6-11.5-7.8Z"
        stroke="url(#playqLogoGrad)"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      {/* Pupil */}
      <circle cx="32" cy="33.2" r="4.1" fill="url(#playqLogoGrad)" />

      {/* Arrow shaft through pupil */}
      <path
        d="M32 36.8V14.2"
        stroke="url(#playqLogoGrad)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Arrow head breaking the top of the Q */}
      <path
        d="M32 7.2 26.2 15.4h11.6L32 7.2Z"
        fill="url(#playqLogoGrad)"
      />
    </svg>
  );
}
