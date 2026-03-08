interface LogoMarkProps {
  size?: number;
  variant?: 'dark' | 'light';
}

export default function LogoMark({ size = 28, variant = 'dark' }: LogoMarkProps) {
  const isDark = variant === 'dark';
  const bg = isDark ? '#1a1a1a' : '#ffffff';
  const stroke = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const lineColor = isDark ? '#ffffff' : '#1d1d1f';
  const shadow = !isDark ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' : undefined;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: shadow }}
    >
      <rect x="0.5" y="0.5" width="27" height="27" rx="5.5" fill={bg} stroke={stroke} strokeWidth="1" />
      <polyline
        points="6,15 10,11 14,16 18,8 22,12"
        stroke={lineColor}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="21" cy="21" r="2.5" fill="#e6007a" />
    </svg>
  );
}
