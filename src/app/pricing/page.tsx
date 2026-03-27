"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const comparisons = [
  { feature: "Habits", free: "3 max", premium: "Unlimited", hl: true },
  { feature: "Goals", free: "2 max", premium: "Unlimited", hl: true },
  { feature: "Expense Tracking", free: "Basic", premium: "Full + Categories", hl: false },
  { feature: "Life Score", free: "Yes", premium: "Yes + Breakdown", hl: false },
  { feature: "Weekly Calendar", free: "No", premium: "Yes", hl: true },
  { feature: "Spending Charts", free: "No", premium: "Yes", hl: true },
  { feature: "AI Insights", free: "1/day", premium: "Unlimited", hl: true },
  { feature: "Category Budgets", free: "No", premium: "Yes", hl: true },
  { feature: "Predictions", free: "No", premium: "Yes", hl: true },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => { fetch("/api/auth/me").then(r=>r.json()).then(d=>{if(d.isPremium)setIsPremium(true);}).catch(()=>{}); }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/razorpay/order", { method: "POST" });
      const data = await res.json();
      if (data.error) { alert(data.error); setLoading(false); return; }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const options = { key: data.keyId, amount: data.amount, currency: data.currency, name: "LifeOS", description: "Premium Plan — ₹99/month", order_id: data.orderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/razorpay/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, userId: data.userId }) });
            const result = await verifyRes.json();
            if (result.success) router.push("/dashboard?upgraded=true"); else alert("Payment verification failed.");
          },
          prefill: {}, theme: { color: "#6366F1" }, modal: { ondismiss: () => setLoading(false) },
        };
        const rzp = new (window as unknown as { Razorpay: new (opts: typeof options) => { open: () => void } }).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch { alert("Something went wrong."); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-dark-bg relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-accent-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent-secondary/10 rounded-full blur-[100px]" />

      <nav className="relative z-10 bg-dark-bg/90 backdrop-blur-xl border-b border-white/5 sticky top-0">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black">Life<span className="text-gradient">OS</span></Link>
          <Link href="/dashboard" className="text-sm text-white/40 hover:text-white transition-colors">← Dashboard</Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black mb-3">Unlock Your Full Potential</h1>
          <p className="text-white/40">Start free. Upgrade when you&apos;re ready to transform.</p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
          <div className="glass p-6">
            <div className="text-sm font-bold text-white/50 mb-1">Free</div>
            <div className="text-3xl font-black mb-4">₹0</div>
            <div className="space-y-2.5 mb-6">{["Expense tracking", "3 daily habits", "Life Score", "2 goals", "1 AI insight/day", "Achievements"].map((f,i)=>(
              <div key={i} className="flex items-center gap-2 text-sm text-white/60"><span className="text-green-400 text-xs">✓</span>{f}</div>
            ))}</div>
            <button onClick={()=>router.push("/auth")} className="btn-outline w-full py-3 text-sm">Start Free</button>
          </div>

          <div className="glass p-6 border-accent-primary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-primary text-white text-[9px] font-black px-3 py-1 rounded-bl-2xl">BEST VALUE</div>
            <div className="text-sm font-bold text-accent-primary mb-1">Premium</div>
            <div className="text-3xl font-black mb-1">₹99<span className="text-lg text-white/40 font-normal">/mo</span></div>
            <div className="text-xs text-white/30 mb-4">Save ₹15,000+/month with insights</div>
            <div className="space-y-2.5 mb-6">{["Everything in Free", "Unlimited habits & goals", "Unlimited AI insights", "Spending predictions", "Category budgets", "7-day spending charts", "Weekly habit calendar", "Monthly reports"].map((f,i)=>(
              <div key={i} className="flex items-center gap-2 text-sm text-white/60"><span className="text-accent-primary text-xs">✓</span>{f}</div>
            ))}</div>
            {isPremium ? (
              <div className="w-full py-3 text-center text-sm font-bold text-green-400 bg-green-500/10 rounded-2xl border border-green-500/20">✓ Active</div>
            ) : (
              <button onClick={handleUpgrade} disabled={loading} className="btn-primary w-full py-3 text-sm shadow-glow disabled:opacity-50">
                {loading ? "Processing..." : "Upgrade Now →"}
              </button>
            )}
          </div>
        </div>

        {/* Comparison */}
        <div className="glass p-6 max-w-2xl mx-auto mb-16 overflow-x-auto">
          <h3 className="font-bold mb-4 text-center">Feature Comparison</h3>
          <table className="w-full text-sm">
            <thead><tr className="text-white/30 text-xs"><th className="text-left py-2 font-medium">Feature</th><th className="text-center py-2 font-medium">Free</th><th className="text-center py-2 font-medium text-accent-primary">Premium</th></tr></thead>
            <tbody>{comparisons.map((c,i)=>(
              <tr key={i} className={`border-t border-white/5 ${c.hl?"":"opacity-60"}`}>
                <td className="py-2.5 font-medium">{c.feature}</td>
                <td className="py-2.5 text-center text-white/40">{c.free}</td>
                <td className="py-2.5 text-center text-accent-primary font-semibold">{c.premium}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h3 className="font-bold text-center mb-6">FAQ</h3>
          <div className="space-y-3">
            {[
              { q: "Can I cancel anytime?", a: "Yes. Cancel anytime, no questions asked." },
              { q: "Is there a money-back guarantee?", a: "Yes! 30-day money-back guarantee." },
              { q: "Is my data safe?", a: "Absolutely. Your data is encrypted and private." },
              { q: "What payment methods?", a: "UPI, cards, net banking via Razorpay." },
            ].map((f,i)=>(
              <div key={i} className="glass p-4">
                <p className="text-sm font-bold mb-1">{f.q}</p>
                <p className="text-xs text-white/40">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        {!isPremium && (
          <div className="text-center pb-8">
            <h3 className="text-xl font-black mb-3">Ready to transform?</h3>
            <button onClick={handleUpgrade} disabled={loading} className="btn-primary px-10 py-4 text-base font-bold shadow-glow-lg active:scale-95 transition-all disabled:opacity-50">
              {loading ? "Processing..." : "Get Premium → ₹99/mo"}
            </button>
            <p className="text-xs text-white/20 mt-3">30-day money-back guarantee</p>
          </div>
        )}
      </div>

      <footer className="relative z-10 border-t border-white/5 py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-xs text-white/20">© 2024 LifeOS</div>
      </footer>
    </div>
  );
}
