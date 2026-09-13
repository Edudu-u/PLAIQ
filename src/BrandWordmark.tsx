type BrandWordmarkProps = {
  className?: string;
};

/** Same Syne display face as the rest of the name — a real letter Q, not an icon. */
export function BrandWordmark({ className = "" }: BrandWordmarkProps) {
  return (
    <span className={`brand-wordmark ${className}`.trim()}>PLAYQ.GG</span>
  );
}
