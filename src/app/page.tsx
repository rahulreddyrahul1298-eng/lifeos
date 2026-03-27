"use client";

import { useRouter } from "next/navigation";

const highlights = [
  { title: "Track every rupee", body: "Add expenses quickly and see exactly where your money goes." },
  { title: "Budget by category", body: "Set smart category caps and get warned before you overspend." },
  { title: "Save with intent", body: "Turn travel, emergency, wedding, or education plans into visible progress." },
  { title: "Manage EMIs", body: "Keep debt balances and monthly EMI commitments in one clean place." },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <nav className="flex items-center justify-between rounded-[28px] border border-slate-200/80 bg-white px-6 py-4 shadow-sm">
          <div>
            <p className="eyebrow">LifeOS</p>
            <p className="text-lg font-extrabold">Personal finance for everyday life</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/auth")} className="btn-secondary px-4 py-2 text-sm">
              Log in
            </button>
            <button onClick={() => router.push("/auth")} className="btn-primary px-5 py-2.5 text-sm">
              Get started
            </button>
          </div>
        </nav>

        <section className="grid gap-10 py-16 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full bg-[#E8F0FE] px-4 py-2 text-sm font-bold text-[#1A73E8]">
              Built for budgeting, goals, and debt tracking
            </div>
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-tight sm:text-6xl">
              Know where your money goes, before the month disappears.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-500">
              LifeOS gives you a clean Google Pay-style finance home for income, budgets, transactions, savings goals, and EMIs.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button onClick={() => router.push("/auth")} className="btn-primary px-8 py-4 text-base">
                Start free
              </button>
              <button onClick={() => router.push("/pricing")} className="btn-secondary px-8 py-4 text-base">
                View premium
              </button>
            </div>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              <Stat value="3 tabs" label="Home, Transactions, Goals" />
              <Stat value="Smart rules" label="Swiggy, Uber, Amazon auto-categorize" />
              <Stat value="Budget alerts" label="Warnings before you overspend" />
            </div>
          </div>

          <div className="card overflow-hidden p-6">
            <div className="rounded-[24px] bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="eyebrow">Monthly snapshot</p>
                  <p className="mt-2 text-3xl font-extrabold">Rs 50,000</p>
                </div>
                <div className="rounded-full bg-[#E8F0FE] px-4 py-2 text-sm font-bold text-[#1A73E8]">HDFC</div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <PreviewCard title="Spent" value="Rs 23,450" tone="red" />
                <PreviewCard title="Remaining" value="Rs 26,550" tone="green" />
                <PreviewCard title="Goal saved" value="Rs 8,000" tone="blue" />
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <PreviewRow emoji="??" title="Food & Dining" detail="Rs 6,200 of Rs 7,000" />
              <PreviewRow emoji="??" title="Transport" detail="Rs 2,150 of Rs 3,000" />
              <PreviewRow emoji="??" title="Emergency Fund" detail="40% complete" />
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-16 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.title} className="card p-6">
              <h2 className="text-xl font-extrabold">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[22px] bg-white p-4 shadow-sm">
      <p className="text-lg font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function PreviewCard({ title, value, tone }: { title: string; value: string; tone: "red" | "green" | "blue" }) {
  const tones = {
    red: "bg-[#FDECEC] text-[#D93025]",
    green: "bg-[#E9F7EF] text-[#0F9D58]",
    blue: "bg-[#E8F0FE] text-[#1A73E8]",
  } as const;

  return (
    <div className={`rounded-[20px] p-4 ${tones[tone]}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-lg font-extrabold">{value}</p>
    </div>
  );
}

function PreviewRow({ emoji, title, detail }: { emoji: string; title: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white px-4 py-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-2xl">{emoji}</div>
      <div>
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{detail}</p>
      </div>
    </div>
  );
}

