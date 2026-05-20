interface Props {
  size?: number;
  color?: string;
}

export function GoldCrown({ size = 28, color = "#c9a961" }: Props) {
  return (
    <svg
      width={size}
      height={size * 0.55}
      viewBox="0 0 240 130"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M30 105 L30 55 L60 78 L90 38 L120 65 L150 38 L180 78 L210 55 L210 105 Z"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeLinejoin="round"
      />
      <line x1="30" y1="105" x2="210" y2="105" stroke={color} strokeWidth="3" />
      <line x1="30" y1="118" x2="210" y2="118" stroke={color} strokeWidth="3" />
      <circle cx="60"  cy="78" r="4.5" fill={color} />
      <circle cx="90"  cy="38" r="5"   fill={color} />
      <circle cx="120" cy="65" r="4.5" fill={color} />
      <circle cx="150" cy="38" r="5"   fill={color} />
      <circle cx="180" cy="78" r="4.5" fill={color} />
    </svg>
  );
}
