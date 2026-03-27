"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (searchParams.get("mode") === "signup") setIsSignup(true); }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { email, password, name } : { email, password };
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong"); return; }
      router.push(data.onboarded ? "/dashboard" : "/onboarding");
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  const handleGuest = async () => {
    setLoading(true);
    try { const res = await fetch("/api/auth/guest", { method: "POST" }); const data = await res.json(); if (data.success) router.push("/onboarding"); }
    catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass p-8">
      <h1 className="text-xl font-bold text-center mb-1">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="text-sm text-white/40 text-center mb-8">
        {isSignup ? "Start your 30-day transformation" : "Continue your journey"}
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl p-3 mb-6">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <div>
            <label className="block text-sm text-white/50 font-medium mb-1.5">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="Your name" />
          </div>
        )}
        <div>
          <label className="block text-sm text-white/50 font-medium mb-1.5">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm text-white/50 font-medium mb-1.5">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input-field" placeholder="Min 6 characters" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full btn-primary py-3 text-sm disabled:opacity-50 mt-2 shadow-glow">
          {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-white/30">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <button onClick={handleGuest} disabled={loading} className="w-full btn-outline py-3 text-sm disabled:opacity-50">
        Continue as Guest
      </button>

      <p className="text-center text-sm text-white/40 mt-6">
        {isSignup ? (
          <>Already have an account?{" "}<button onClick={() => setIsSignup(false)} className="text-accent-primary font-medium hover:underline">Sign in</button></>
        ) : (
          <>Don&apos;t have an account?{" "}<button onClick={() => setIsSignup(true)} className="text-accent-primary font-medium hover:underline">Sign up</button></>
        )}
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-accent-primary/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent-secondary/10 rounded-full blur-[100px]" />
      <div className="w-full max-w-sm relative z-10">
        <Link href="/" className="block text-center mb-10">
          <span className="text-xl font-black">Life<span className="text-gradient">OS</span></span>
        </Link>
        <Suspense fallback={<div className="glass p-8 text-center text-white/30 text-sm">Loading...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
