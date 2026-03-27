"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((data) => {
        if (data.isPremium) setIsPremium(true);
      })
      .catch(() => undefined);
  }, []);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const response = await fetch("/api/razorpay/order", { method: "POST" });
      const data = await response.json();
      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "LifeOS",
          description: "Premium Plan - Rs 99/month",
          order_id: data.orderId,
          handler: async (result: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            const verifyResponse = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: result.razorpay_order_id,
                razorpay_payment_id: result.razorpay_payment_id,
                razorpay_signature: result.razorpay_signature,
                userId: data.userId,
              }),
            });
            const verified = await verifyResponse.json();
            if (verified.success) {
              router.push("/dashboard?upgraded=true");
            } else {
              alert("Payment verification failed.");
            }
          },
          prefill: {},
          theme: { color: "#1A73E8" },
          modal: { ondismiss: () => setLoading(false) },
        };

        const RazorpayCtor = (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay;
        const razorpay = new RazorpayCtor(options);
        razorpay.open();
      };
      document.body.appendChild(script);
    } catch {
      alert("Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <nav className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="text-lg font-extrabold text-slate-900">LifeOS</Link>
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500">Back to dashboard</Link>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <p className="eyebrow">Premium</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Upgrade for deeper financial insight</h1>
          <p className="mt-3 text-lg text-slate-500">Keep Razorpay checkout live and unlock projections on top of your finance dashboard.</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="card p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Free</p>
            <p className="mt-4 text-4xl font-extrabold text-slate-900">Rs 0</p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {[
                "Expense tracking",
                "Category budgets",
                "Savings goals",
                "Debt tracking",
                "Auto-categorization",
                "Budget alerts",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="text-[#0F9D58]">?</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/auth")} className="btn-secondary mt-8 w-full py-3.5 text-sm">
              Start free
            </button>
          </div>

          <div className="card border-2 border-[#E8F0FE] p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#1A73E8]">Premium</p>
            <p className="mt-4 text-4xl font-extrabold text-slate-900">Rs 99<span className="text-lg font-semibold text-slate-400">/month</span></p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              {[
                "Everything in Free",
                "Monthly spending projections",
                "Savings forecasts",
                "Average daily spend tracking",
                "Smarter premium insights",
                "Priority support",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className="text-[#1A73E8]">?</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
            {isPremium ? (
              <div className="mt-8 rounded-2xl bg-[#E9F7EF] px-4 py-3 text-center text-sm font-bold text-[#0F9D58]">
                Premium active
              </div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} className="btn-primary mt-8 w-full py-3.5 text-sm">
                {loading ? "Processing..." : "Upgrade with Razorpay"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

