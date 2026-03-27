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
  const glowFilter = score >= 80 ? `drop-shadow(0 0 8px ${color}40)` : "none";

  useEffect(() => { const t = setTimeout(() => setAnimatedScore(score), 100); return () => clearTimeout(t); }, [score]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size, filter: glowFilter }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease" }} />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white">{score}</span>
          <span className="text-[8px] text-white/40 font-semibold tracking-widest uppercase">Score</span>
        </div>
      )}
    </div>
  );
}
