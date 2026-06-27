import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export default function YalaEpidemicLogo({ size = 40, className = "" }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Main teal-to-blue gradient for the cross */}
        <linearGradient id="crossGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2c4" />
          <stop offset="45%" stopColor="#00b8d4" />
          <stop offset="100%" stopColor="#072040" />
        </linearGradient>
        {/* Shadow for depth */}
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#001833" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Main Medical Cross with rounded corners */}
      <path 
        d="M 180,60 H 320 Q 340,60 340,80 V 160 H 420 Q 440,160 440,180 V 320 Q 440,340 420,340 H 340 V 420 Q 340,440 320,440 H 180 Q 160,440 160,420 V 340 H 80 Q 60,340 60,320 V 180 Q 60,160 80,160 H 160 V 80 Q 160,60 180,60 Z" 
        fill="url(#crossGrad)" 
        filter="url(#logoShadow)"
      />

      {/* Dynamic swoosh on the bottom of the cross */}
      <path 
        d="M 68,290 C 130,340 170,440 300,440 C 370,440 440,380 440,240 C 440,240 440,340 420,340 H 340 V 420 C 340,440 320,440 300,440 Q 200,440 160,340 C 120,240 68,290 68,290 Z" 
        fill="#071b35"
      />

      {/* Another elegant cyan swoosh highlight */}
      <path 
        d="M 68,290 C 80,360 140,410 200,410 C 270,410 320,360 350,300 C 260,340 180,350 140,320 C 100,290 68,290 68,290 Z" 
        fill="#00b8d4"
        opacity="0.8"
      />

      {/* White Chat Bubble in the Center */}
      <g filter="url(#logoShadow)">
        <path 
          d="M 250,150 C 195,150 150,190 150,240 C 150,265 160,288 178,305 L 168,340 L 208,326 C 221,329 235,330 250,330 C 305,330 350,290 350,240 C 350,190 305,150 250,150 Z" 
          fill="#ffffff" 
        />
        {/* Three dots inside chat bubble representing the Line chatbot */}
        <circle cx="210" cy="240" r="14" fill="#071b35" />
        <circle cx="250" cy="240" r="14" fill="#071b35" />
        <circle cx="290" cy="240" r="14" fill="#071b35" />
      </g>
    </svg>
  );
}
