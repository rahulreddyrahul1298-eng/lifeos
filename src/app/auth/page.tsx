"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") setIsSignup(true);
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup ? { email, password, name } : { email, password };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      router.push(data.onboarded ? "/dashboard" : "/onboarding");
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/guest", { method: "POST" });
      const data = await response.json();
      if (data.success) router.push("/onboarding");
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 sm:p-10">
      <h1 className="mb-1 text-center text-2xl font-extrabold text-slate-900">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mb-8 text-center text-sm text-slate-500">
        {isSignup ? "Start building better money habits today." : "Continue managing your money in one place."}
      </p>

      {error ? <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</div> : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup ? (
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Name</label>
            <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="input-field" placeholder="Your name" />
          </div>
        ) : null}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="input-field" placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} className="input-field" placeholder="Minimum 6 characters" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-3.5 text-sm">
          {loading ? "Please wait..." : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <button onClick={handleGuest} disabled={loading} className="btn-secondary w-full py-3.5 text-sm">
        Continue as guest
      </button>

      <p className="mt-7 text-center text-sm text-slate-500">
        {isSignup ? "Already have an account? " : "Don't have an account? "}
        <button onClick={() => setIsSignup((current) => !current)} className="font-semibold text-[#1A73E8]">
          {isSignup ? "Sign in" : "Sign up"}
        </button>
      </p>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC] px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-10 block text-center text-2xl font-extrabold text-slate-900">
          LifeOS
        </Link>
        <Suspense fallback={<div className="card p-10 text-center text-sm text-slate-500">Loading...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}

