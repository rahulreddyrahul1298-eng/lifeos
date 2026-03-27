"use client";
import { useEffect, useState } from "react";

export default function ProgressRing({ score, size = 112, strokeWidth = 6, showLabel = true, className = "" }: {
  score: number; size?: number; strokeWidth?: number; showLabel?: boolean; className?: string;
}) {
  const [val, setVal] = useState(0);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (val / 100) * circ;
  const color = score >= 70 ? "#22C55E" : score >= 40 ? "#F59E0B" : "#EF4444";

  useEffect(() => { const t = setTimeout(() => setVal(score), 150); return () => clearTimeout(t); }, [score]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.5s ease", filter: score >= 80 ? `drop-shadow(0 0 6px ${color}40)` : "none" }} />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-ink-900">{score}</span>
          <span className="text-[8px] text-ink-300 font-bold tracking-widest uppercase">Score</span>
        </div>
      )}
    </div>
  );
}
