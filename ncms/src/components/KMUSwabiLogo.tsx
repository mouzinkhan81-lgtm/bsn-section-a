import React from 'react';

interface KMUSwabiLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'badge' | 'inverted' | 'monochrome';
}

export const KMUSwabiLogo: React.FC<KMUSwabiLogoProps> = ({
  className = 'w-16 h-16',
  size,
  variant = 'badge'
}) => {
  const isDark = variant === 'inverted';
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const maroonColor = '#9E1C1C';
  const maroonDark = '#7A1313';
  const bgColor = variant === 'badge' ? '#FFFFFF' : 'transparent';

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Top curved path for KHYBER MEDICAL UNIVERSITY */}
        <path
          id="kmu-top-arc"
          d="M 46,200 A 154,154 0 1,1 354,200"
          fill="none"
        />
        {/* Bottom curved path for SWABI */}
        <path
          id="kmu-bottom-arc"
          d="M 90,270 A 120,120 0 0,0 310,270"
          fill="none"
        />
        {/* Maroon gradient for official medical emblem */}
        <linearGradient id="kmu-maroon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B91C1C" />
          <stop offset="50%" stopColor="#991B1B" />
          <stop offset="100%" stopColor="#7F1D1D" />
        </linearGradient>
        <filter id="kmu-subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Optional Circular background disc if badge */}
      {variant === 'badge' && (
        <circle cx="200" cy="200" r="195" fill={bgColor} />
      )}

      {/* Top Arched Text: KHYBER MEDICAL UNIVERSITY */}
      <text
        fill={textColor}
        fontSize="24"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="3.2"
      >
        <textPath
          href="#kmu-top-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          KHYBER MEDICAL UNIVERSITY
        </textPath>
      </text>

      {/* CENTER EMBLEM GROUP */}
      <g transform="translate(100, 115)">
        {/* Geometric Caduceus / Asclepius Ribbon in Crimson Maroon */}
        <g filter="url(#kmu-subtle-shadow)">
          {/* Top Diamond / Finial */}
          <polygon
            points="28,2 38,15 28,28 18,15"
            fill="url(#kmu-maroon-grad)"
          />

          {/* Central Medical Staff (behind ribbon) */}
          <rect x="25" y="15" width="6" height="135" rx="3" fill={maroonDark} />

          {/* First loop / fold */}
          <path
            d="M 3,42 L 53,24 L 53,38 L 18,52 Z"
            fill="url(#kmu-maroon-grad)"
          />
          {/* First crossing fold */}
          <path
            d="M 3,42 L 18,52 L 18,74 L 3,64 Z"
            fill={maroonDark}
          />

          {/* Second loop / fold */}
          <path
            d="M 3,82 L 53,64 L 53,78 L 18,92 Z"
            fill="url(#kmu-maroon-grad)"
          />
          {/* Second crossing fold */}
          <path
            d="M 3,82 L 18,92 L 18,114 L 3,104 Z"
            fill={maroonDark}
          />

          {/* Third loop / fold */}
          <path
            d="M 3,122 L 53,104 L 53,118 L 18,132 Z"
            fill="url(#kmu-maroon-grad)"
          />
          {/* Bottom terminal base */}
          <path
            d="M 3,122 L 18,132 L 28,142 L 28,150 L 3,140 Z"
            fill={maroonDark}
          />
        </g>

        {/* Big Bold "IHS" Typography */}
        <text
          x="68"
          y="108"
          fill={textColor}
          fontSize="92"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="-2"
        >
          IHS
        </text>

        {/* INSTITUTE OF HEALTH SCIENCES Subtext under IHS */}
        <text
          x="70"
          y="132"
          fill={textColor}
          fontSize="11"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          letterSpacing="0.8"
        >
          INSTITUTE OF HEALTH SCIENCES
        </text>
      </g>

      {/* Bottom Arched Text: SWABI */}
      <text
        fill={textColor}
        fontSize="38"
        fontWeight="900"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        letterSpacing="6"
      >
        <textPath
          href="#kmu-bottom-arc"
          startOffset="50%"
          textAnchor="middle"
        >
          SWABI
        </textPath>
      </text>
    </svg>
  );
};
