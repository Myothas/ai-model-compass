import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ACTIVITIES, PROVIDERS, blendedPrice, fmtCtx, fmtUsd, overall, type Activity } from "@/data/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { modelsQuery } from "@/data/live.functions";
import { ProviderLogo } from "@/components/site/chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ModelMatch — Find the best AI model for your task" },
      { name: "description", content: "Free leaderboard ranking AI models by coding, reasoning, writing, maths, vision, speed and price." },
      { property: "og:title", content: "ModelMatch — AI model leaderboard" },
      { property: "og:description", content: "Rank GPT, Claude, Gemini, Llama and more by task and cost." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(modelsQuery),
  component: Index,
});

type Sort = Activity | "newest" | "overall" | "price" | "value";

function Index() {
  const [sort, setSort] = useState<Sort>("newest");
  const [openOnly, setOpenOnly] = useState(false);
  const [provider, setProvider] = useState<string>("all");
  const [picked, setPicked] = useState<string[]>([]);

  const { data: { models: MODELS, live, benchmarks, fetchedAt } } = useSuspenseQuery(modelsQuery);
  const rows = useMemo(() => {
    const score = (m: (typeof MODELS)[number]) =>
      sort === "newest" ? Date.parse(m.released) : sort === "overall" ? overall(m) : sort === "price" ? -blendedPrice(m) : sort === "value" ? overall(m) / Math.log2(2 + blendedPrice(m)) : m.scores[sort];
    return MODELS.filter((m) => (!openOnly || m.openWeights) && (provider === "all" || m.provider === provider)).sort((a, b) => score(b) - score(a));
  }, [sort, openOnly, provider, MODELS]);

  const top = rows[0];
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 4 ? p : [...p, id]));
  const chip = (on: boolean) => `rounded-full border-2 border-ink px-4 py-1.5 text-sm font-semibold transition ${on ? "bg-ink text-ink-foreground" : "bg-card hover:bg-accent"}`;

  return (
    <main className="mx-auto max-w-6xl px-4">
      <section className="grid-paper relative mt-6 overflow-hidden rounded-3xl border-2 border-ink bg-card px-6 py-14 md:px-12">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{MODELS.length} models · {Object.keys(PROVIDERS).length} providers · {live ? `live prices, updated ${new Date(fetchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : "offline copy"} · always free</p>
        <h1 className="mt-3 max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl animate-rise">
          Which AI is best for <span className="rounded-xl bg-accent px-2">what you do?</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground">Pick a task, see who wins, and how much it costs. Tick up to four models to compare them side by side.</p>
        <div className="pointer-events-none absolute -right-6 top-6 hidden grid-cols-3 gap-3 rotate-6 md:grid">
          {Object.values(PROVIDERS).slice(0, 6).map((p, i) => (
            <div key={p.id} className="pop grid h-20 w-20 place-items-center rounded-2xl bg-background animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
              <img src={p.logo} alt="" width={40} height={40} />
            </div>
          ))}
        </div>
        {benchmarks && <p className="mt-4 text-sm text-muted-foreground">Skill scores from <a href="https://artificialanalysis.ai" target="_blank" rel="noreferrer" className="font-semibold underline">Artificial Analysis</a>, scaled so the top model scores 100.</p>}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">What do you need it for?</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-9">
          {([{ id: "newest", label: "Newest", blurb: "Latest releases first" }, { id: "overall", label: "All-round", blurb: "Average of every skill" }, ...ACTIVITIES, { id: "price", label: "Cheapest", blurb: "Lowest blended price" }, { id: "value", label: "Best value", blurb: "Quality per dollar" }] as { id: Sort; label: string; blurb: string }[]).map((a) => (
            <button key={a.id} onClick={() => setSort(a.id)} className={`flex flex-col items-start rounded-2xl border-2 border-ink p-3 text-left transition ${sort === a.id ? "bg-accent shadow-pop -translate-x-0.5 -translate-y-0.5" : "bg-card hover:bg-secondary"}`}>
              <div className="font-display font-bold leading-tight">{a.label}</div>
              <div className="mt-1 text-xs leading-tight text-muted-foreground">{a.blurb}</div>
            </button>
          ))}
        </div>
      </section>

      {top && (
        <section className="mt-8 flex flex-col gap-4 rounded-3xl bg-ink p-6 text-ink-foreground md:flex-row md:items-center">
          <ProviderLogo provider={PROVIDERS[top.provider]!} size={40} />
          <div className="flex-1">
            <p className="font-mono text-xs uppercase tracking-widest opacity-70">Top pick</p>
            <Link to="/models/$id" params={{ id: top.id }} className="font-display text-3xl font-extrabold hover:underline">{top.name}</Link>
            <p className="opacity-80">{top.summary}</p>
          </div>
          <div className="font-mono text-sm">{fmtUsd(top.inputPrice)} in · {fmtUsd(top.outputPrice)} out <span className="opacity-60">/1M</span></div>
        </section>
      )}

      <section className="mt-8 flex flex-wrap items-center gap-2">
        <button className={chip(provider === "all")} onClick={() => setProvider("all")}>All</button>
        {Object.values(PROVIDERS).map((p) => (
          <button key={p.id} className={`${chip(provider === p.id)} flex items-center gap-2`} onClick={() => setProvider(p.id)}>
            <img src={p.logo} alt="" width={16} height={16} /> {p.name}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} className="h-4 w-4 accent-[var(--ink)]" /> Open weights only
        </label>
      </section>

      <section className="mt-4 overflow-hidden rounded-3xl border-2 border-ink bg-card">
        {rows.map((m, i) => {
          const val = !m.rated ? 0 : sort === "overall" || sort === "value" || sort === "price" || sort === "newest" ? overall(m) : m.scores[sort];
          return (
            <div key={m.id} className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-4 border-b border-border px-4 py-4 last:border-0 md:grid-cols-[2rem_auto_1.4fr_2fr_auto_auto]">
              <input type="checkbox" aria-label={`Compare ${m.name}`} checked={picked.includes(m.id)} onChange={() => toggle(m.id)} className="h-4 w-4 accent-[var(--ink)]" />
              <ProviderLogo provider={PROVIDERS[m.provider]!} />
              <div className="min-w-0">
                <Link to="/models/$id" params={{ id: m.id }} className="font-display text-lg font-bold hover:underline">
                  <span className="mr-2 font-mono text-sm text-muted-foreground">#{i + 1}</span>{m.name}
                </Link>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                  <span>{PROVIDERS[m.provider]!.name}</span>·<span>{fmtCtx(m.context)} context</span>·<span>{m.released}</span>
                  {m.openWeights && <span className="rounded-full bg-accent px-2 font-semibold text-accent-foreground">open</span>}
                </div>
              </div>
              <div className="col-span-4 md:col-span-1">
                {m.rated ? (
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${val}%` }} />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground md:invisible">not rated yet</span>
                )}
              </div>
              <div className="hidden font-display text-2xl font-extrabold md:block">{m.rated ? val || "—" : <span className="text-xs font-semibold text-muted-foreground">not rated yet</span>}</div>
              <div className="hidden text-right font-mono text-xs md:block">{fmtUsd(blendedPrice(m))}<div className="text-muted-foreground">blended /1M</div></div>
            </div>
          );
        })}
      </section>

      {picked.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit items-center gap-3 rounded-full bg-ink px-5 py-3 text-ink-foreground shadow-card animate-rise">
          <span className="text-sm">{picked.length} selected</span>
          <Link to="/compare" search={{ ids: picked.join(",") }} className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">Compare →</Link>
          <button onClick={() => setPicked([])} className="text-sm opacity-70 hover:opacity-100">Clear</button>
        </div>
      )}
    </main>
  );
}
