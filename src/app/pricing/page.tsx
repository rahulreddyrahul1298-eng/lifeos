"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const comparisons = [
  { feature: "Habits", free: "3 max", premium: "Unlimited", highlight: true },
  { feature: "Goals", free: "2 max", premium: "Unlimited", highlight: true },
  { feature: "Expense Tracking", free: "Basic", premium: "Full + Categories", highlight: false },
  { feature: "Life Score", free: "Yes", premium: "Yes + Breakdown", highlight: false },
  { feature: "Weekly Habit Calendar", free: "No", premium: "Yes", highlight: true },
  { feature: "7-Day Spending Charts", free: "No", premium: "Yes", highlight: true },
  { feature: "Smart Insights", free: "1 per day", premium: "Unlimited", highlight: true },
  { feature: "Category Budgets", free: "No", premium: "Yes", highlight: true },
  { feature: "Spending Predictions", free: "No", premium: "Yes", highlight: true },
  { feature: "Data Export", free: "No", premium: "Yes", highlight: false },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (d.isPremium) setIsPremium(true);
    }).catch(() => {});
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Create Razorpay order
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setLoading(false);
        return;
      }

      // Load Razorpay checkout
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "LifeOS",
          description: "Premium Plan — ₹99/month",
          order_id: data.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            // Verify payment on server
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: data.userId,
              }),
            });
            const result = await verifyRes.json();
            if (result.success) {
              router.push("/dashboard?upgraded=true");
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          },
          prefill: {},
          theme: { color: "#6366F1" },
          modal: {
            ondismiss: () => setLoading(false),
          },
        };
        const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Life<span className="text-indigo-500">OS</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center py-20">
          <p className="text-sm font-medium text-indigo-500 mb-3">Pricing</p>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            The math is simple
          </h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Spend ₹99 per month. Save ₹15,000. That&apos;s a 150x return on your investment.
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-24">
          {/* Free */}
          <div className="card p-8">
            <p className="text-sm font-medium text-gray-400 mb-4">Free</p>
            <div className="text-4xl font-bold text-gray-900 mb-1">₹0</div>
            <p className="text-sm text-gray-400 mb-8">Get started, see where money goes</p>
            <ul className="space-y-3 mb-8">
              {["Expense tracking", "3 habits with streaks", "Life Score", "2 goals", "Achievements", "1 daily insight"].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
              {["Spending charts", "Category budgets", "Predictions", "Unlimited insights"].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-300">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={() => router.push("/dashboard")} className="w-full btn-outline py-3 text-sm">
              {isPremium ? "Downgrade" : "Current Plan"}
            </button>
          </div>

          {/* Premium */}
          <div className="card p-8 border-indigo-200 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-xs font-medium">
              Most popular
            </div>
            <p className="text-sm font-medium text-indigo-500 mb-4">Premium</p>
            <div className="text-4xl font-bold text-gray-900 mb-1">
              ₹99<span className="text-lg font-normal text-gray-400">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-8">₹3.3/day — less than a cup of tea</p>
            <ul className="space-y-3 mb-8">
              {[
                "Everything in Free",
                "Spending predictions",
                "Category budgets & alerts",
                "7-day spending charts",
                "Weekly habit calendar",
                "Unlimited smart insights",
                "Unlimited habits & goals",
                "Monthly savings report",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm text-gray-600">
                  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <button onClick={handleUpgrade} disabled={loading || isPremium}
              className="w-full btn-primary py-3 text-sm disabled:opacity-50">
              {isPremium ? "You're on Premium" : loading ? "Redirecting..." : "Upgrade — ₹99/mo"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">30-day money-back guarantee. Cancel anytime.</p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="max-w-3xl mx-auto mb-24">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">Feature comparison</h2>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-6 text-gray-500 font-medium">Feature</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium w-24">Free</th>
                  <th className="text-center py-3 px-4 text-indigo-500 font-semibold w-24">Premium</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-6 text-gray-700">{row.feature}</td>
                    <td className="py-3 px-4 text-center text-gray-400">{row.free}</td>
                    <td className="py-3 px-4 text-center text-gray-900 font-medium">{row.premium}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-24">
          <h2 className="text-xl font-bold text-center text-gray-900 mb-8">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel your subscription anytime from your dashboard. No questions asked." },
              { q: "Is there a money-back guarantee?", a: "Yes. If you're not satisfied within 30 days, we'll refund you fully." },
              { q: "Is my data safe?", a: "Your data is encrypted and stored securely. We never sell your data." },
              { q: "What payment methods do you accept?", a: "All major credit/debit cards and UPI through Stripe." },
              { q: "How is Premium different?", a: "Free gives you basics. Premium unlocks predictions, charts, unlimited habits, category budgets, and more." },
            ].map((faq, i) => (
              <div key={i} className="card p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        {!isPremium && (
          <div className="text-center pb-24">
            <div className="card p-10 max-w-lg mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start saving?</h3>
              <p className="text-sm text-gray-500 mb-6">Join thousands building better financial habits.</p>
              <button onClick={handleUpgrade} disabled={loading}
                className="btn-primary px-8 py-3 text-sm disabled:opacity-50">
                {loading ? "Redirecting..." : "Start Premium — ₹99/mo"}
              </button>
              <p className="text-xs text-gray-400 mt-3">30-day money-back guarantee</p>
            </div>
          </div>
        )}
      </div>

      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          © 2026 Life<span className="font-semibold text-gray-500">OS</span>. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
