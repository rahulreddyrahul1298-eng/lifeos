"use client";
import { useEffect, useState } from "react";

interface ToastProps {
  message: string;
  icon?: string;
  duration?: number;
  onClose: () => void;
}

export default function Toast({ message, icon = "🎉", duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
      visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
    }`}>
      <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-float flex items-center gap-2.5 text-sm font-medium">
        <span className="text-lg">{icon}</span>
        {message}
      </div>
    </div>
  );
}
