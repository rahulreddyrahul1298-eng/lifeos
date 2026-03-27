import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LifeOS — Fix Your Life in 30 Days",
  description: "Money. Discipline. Habits. One system. Track spending, build habits, and see real improvement every day.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0B1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-dark-bg text-white">{children}</body>
    </html>
  );
}
