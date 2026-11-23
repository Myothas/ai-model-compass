import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MODELS, PROVIDERS, fmtUsd, workloadCost } from "@/data/models";
import { ProviderLogo } from "@/components/site/chrome";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: "AI cost calculator — ModelMatch" },
      { name: "description", content: "Estimate your monthly bill across every major AI model." },
      { property: "og:title", content: "AI cost calculator — ModelMatch" },
      { property: "og:description", content: "See what your usage would cost on GPT, Claude, Gemini and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Calc,
});

function Slider({ label, value, set, min, max, step, fmt }: { label: string; value: number; set: (n: number) => void; min: number; max: number; step: number; fmt: (n: number) => string }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm font-semibold"><span>{label}</span><span className="font-mono">{fmt(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(+e.target.value)} className="mt-2 w-full accent-[var(--ink)]" />
    </label>
  );
}

function Calc() {
  const [req, setReq] = useState(1000);
  const [inTok, setIn] = useState(1500);
  const [outTok, setOut] = useState(500);
  const list = MODELS.map((m) => ({ m, cost: workloadCost(m, req * 30 * inTok, req * 30 * outTok) })).sort((a, b) => a.cost - b.cost);
  const max = list.at(-1)?.cost ?? 1;
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">What will it cost?</h1>
      <p className="mt-2 text-muted-foreground">Drag the sliders to match your usage. Estimates are per month (30 days).</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[22rem_1fr]">
        <div className="pop h-fit space-y-6 rounded-3xl bg-accent p-6">
          <Slider label="Requests per day" value={req} set={setReq} min={10} max={100000} step={10} fmt={(n) => n.toLocaleString()} />
          <Slider label="Words in per request" value={inTok} set={setIn} min={50} max={50000} step={50} fmt={(n) => `~${Math.round(n * 0.75).toLocaleString()}`} />
          <Slider label="Words out per request" value={outTok} set={setOut} min={50} max={10000} step={50} fmt={(n) => `~${Math.round(n * 0.75).toLocaleString()}`} />
        </div>
        <div className="rounded-3xl border-2 border-ink bg-card p-2">
          {list.map(({ m, cost }) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl p-3 hover:bg-secondary">
              <ProviderLogo provider={PROVIDERS[m.provider]!} size={20} />
              <Link to="/models/$id" params={{ id: m.id }} className="w-40 shrink-0 font-display font-bold hover:underline">{m.name}</Link>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-highlight transition-all" style={{ width: `${Math.max(1, (cost / max) * 100)}%` }} /></div>
              <span className="w-24 text-right font-mono text-sm font-semibold">{fmtUsd(cost)}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
