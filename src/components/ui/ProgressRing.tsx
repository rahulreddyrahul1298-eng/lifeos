"use client";
import { useEffect, useState } from "react";

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  className?: string;
}

export default function ProgressRing({ score, size = 112, strokeWidth = 6, showLabel = true, className = "" }: ProgressRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";
  const glowColor = score >= 80 ? "drop-shadow(0 0 6px rgba(34,197,94,0.3))" : "none";

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size, filter: glowColor }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease" }} />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-[9px] text-gray-400 font-medium tracking-wide uppercase">Life Score</span>
        </div>
      )}
    </div>
  );
}
