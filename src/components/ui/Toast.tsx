"use client";
import { useEffect, useState } from "react";

export default function Toast({ message, icon = "🎉", duration = 3000, onClose }: {
  message: string; icon?: string; duration?: number; onClose: () => void;
}) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setVis(true));
    const t = setTimeout(() => { setVis(false); setTimeout(onClose, 300); }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${vis ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
      <div className="bg-ink-900 text-white px-5 py-3 rounded-2xl shadow-elevated flex items-center gap-2.5 text-sm font-semibold">
        <span className="text-lg">{icon}</span>{message}
      </div>
    </div>
  );
}
