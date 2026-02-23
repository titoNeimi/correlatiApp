interface AppIconProps {
  size?: number;
  className?: string;
}

export default function AppIcon({ size = 32, className = '' }: AppIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="appIconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#appIconGradient)" />
      <line x1="16" y1="7.5"  x2="7"  y2="22.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="16" y1="7.5"  x2="25" y2="22.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.6" strokeLinecap="round" />
      <line x1="7"  y1="22.5" x2="25" y2="22.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.6" strokeLinecap="round" />
      <circle cx="16" cy="7.5"  r="3.5" fill="white" />
      <circle cx="7"  cy="22.5" r="3.5" fill="white" />
      <circle cx="25" cy="22.5" r="3.5" fill="white" />
    </svg>
  );
}
