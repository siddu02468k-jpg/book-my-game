import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'badge' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  // SVG Ticket Icon for avatar / favicon / compact displays
  const TicketIcon = ({ width = 36, height = 36 }: { width?: number; height?: number }) => (
    <svg
      width={width}
      height={height}
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]"
    >
      <defs>
        <linearGradient id="bmg-ticket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#16a34a" />
          <stop offset="50%" stop-color="#22c55e" />
          <stop offset="100%" stop-color="#4ade80" />
        </linearGradient>
      </defs>
      
      {/* Outer Glow Squircle Background */}
      <rect width="44" height="44" rx="12" fill="#0d1410" stroke="#1e2923" strokeWidth="1.5" />
      
      {/* Notched Sports Ticket Stub */}
      <g transform="translate(4, 8)">
        <path
          d="M 4 0 
             L 32 0 
             A 4 4 0 0 1 36 4 
             L 36 10 
             A 3.5 3.5 0 0 0 36 17 
             L 36 24 
             A 4 4 0 0 1 32 28 
             L 4 28 
             A 4 4 0 0 1 0 24 
             L 0 17 
             A 3.5 3.5 0 0 0 0 10 
             L 0 4 
             A 4 4 0 0 1 4 0 Z"
          fill="url(#bmg-ticket-grad)"
        />

        {/* Turf Pitch Lines inside the ticket */}
        <rect x="7" y="4.5" width="22" height="19" rx="2" fill="none" stroke="#042f1a" strokeWidth="0.8" opacity="0.4" />
        <line x1="18" y1="4.5" x2="18" y2="23.5" stroke="#042f1a" strokeWidth="0.8" opacity="0.4" />
        <circle cx="18" cy="14" r="3.5" fill="none" stroke="#042f1a" strokeWidth="0.8" opacity="0.4" />

        {/* Text 'GAME' / 'B' */}
        <text
          x="18"
          y="18"
          textAnchor="middle"
          fill="#052012"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="8.5"
          letterSpacing="0.8"
        >
          GAME
        </text>

        {/* Barcode Lines at Bottom */}
        <g stroke="#052012" strokeWidth="0.9" opacity="0.85">
          <line x1="8" y1="21.5" x2="8" y2="25" />
          <line x1="10" y1="21.5" x2="10" y2="25" />
          <line x1="13" y1="21.5" x2="13" y2="25" />
          <line x1="15" y1="21.5" x2="15" y2="25" />
          <line x1="18" y1="21.5" x2="18" y2="25" />
          <line x1="21" y1="21.5" x2="21" y2="25" />
          <line x1="24" y1="21.5" x2="24" y2="25" />
          <line x1="27" y1="21.5" x2="27" y2="25" />
        </g>
      </g>
    </svg>
  );

  if (variant === 'icon') {
    const dim = size === 'sm' ? 28 : size === 'lg' ? 48 : 38;
    return <TicketIcon width={dim} height={dim} />;
  }

  // Size styling configurations
  const textSizes = {
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg',
    lg: 'text-xl sm:text-2xl',
  };

  const badgeSizes = {
    sm: 'px-2 py-0.5 text-[10px] tracking-wider',
    md: 'px-2.5 py-0.5 text-xs tracking-wider',
    lg: 'px-3.5 py-1 text-sm tracking-widest',
  };

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Ticket Icon Avatar */}
      <TicketIcon width={size === 'sm' ? 32 : size === 'lg' ? 44 : 38} height={size === 'sm' ? 32 : size === 'lg' ? 44 : 38} />

      {/* BookMyShow Style Signature Typography */}
      <div>
        <div className="flex items-center space-x-1.5">
          {/* 'book my' in modern clean white */}
          <span className={`font-black tracking-tight text-white lowercase ${textSizes[size]}`}>
            book my
          </span>

          {/* 'GAME' inside green notched ticket badge */}
          <div
            className={`relative inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sport-500 to-sport-400 text-black font-black uppercase shadow-glow-sm ${badgeSizes[size]}`}
          >
            {/* Left Ticket Notch */}
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-2 rounded-r-full bg-[#0a0f0d] border-r border-[#1e2923]"></span>
            {/* Right Ticket Notch */}
            <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-1.5 h-2 rounded-l-full bg-[#0a0f0d] border-l border-[#1e2923]"></span>
            
            <span className="relative z-10 font-black">GAME</span>
          </div>
        </div>

        {showSubtitle && (
          <p className="text-[10px] font-medium text-slate-400 tracking-tight hidden sm:block">
            Online Turf &amp; Court Booking
          </p>
        )}
      </div>
    </div>
  );
};
