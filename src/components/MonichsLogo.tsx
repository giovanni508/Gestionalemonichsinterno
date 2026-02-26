import React from "react";

interface MonichsLogoProps {
  size?: number;
  className?: string;
}

export default function MonichsLogo({ size = 40, className = "" }: MonichsLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Geometric M shape based on Monichs branding */}
      <path
        d="M50 8L92 88H72L50 48L28 88H8L50 8Z"
        fill="currentColor"
      />
      <path
        d="M50 38L70 78H30L50 38Z"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}
