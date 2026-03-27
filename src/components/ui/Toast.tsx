"use client";

import { useEffect, useState } from "react";

export default function Toast({
  message,
  icon = "?",
  duration = 3000,
  onClose,
}: {
  message: string;
  icon?: string;
  duration?: number;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 250);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`fixed left-1/2 top-5 z-[100] -translate-x-1/2 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl">
        <span className="text-lg">{icon}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}

