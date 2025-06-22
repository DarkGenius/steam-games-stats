import React from 'react';

export function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Лупа */}
      <circle cx="22" cy="22" r="12" stroke="#222" strokeWidth="3" fill="#fff" />
      <rect x="32" y="32" width="10" height="3" rx="1.5" transform="rotate(45 32 32)" fill="#222" />
      {/* Геймпад */}
      <rect x="14" y="18" width="16" height="8" rx="4" fill="#f5b041" stroke="#222" strokeWidth="2" />
      <circle cx="18" cy="22" r="1.2" fill="#222" />
      <circle cx="30" cy="22" r="1.2" fill="#222" />
      <rect x="22.5" y="20.5" width="3" height="3" rx="1.5" fill="#fff" stroke="#222" strokeWidth="1" />
    </svg>
  );
} 