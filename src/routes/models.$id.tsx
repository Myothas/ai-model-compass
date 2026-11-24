import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ACTIVITIES, PROVIDERS, fmtCtx, fmtUsd, getModel, overall } from "@/data/models";
import { useSuspenseQuery } from "@tanstack/react-query";
import { modelsQuery } from "@/data/live.functions";
import { ProviderLogo } from "@/components/site/chrome";

export const Route = createFileRoute("/models/$id")({
  loader: async ({ params, context }) => { const { models } = await context.queryClient.ensureQueryData(modelsQuery); const m = getModel(models, params.id); if (!m) throw notFound(); return m; },
  head: ({ loaderData: m }) => ({
    meta: m ? [
      { title: `${m.name} — price, benchmarks & specs | ModelMatch` },
      { name: "description", content: `${m.name} by ${PROVIDERS[m.provider]!.name}: ${m.summary}` },
      { property: "og:title", content: `${m.name} | ModelMatch` },
      { property: "og:description", content: m.summary },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ] : [{ title: "Model not found | ModelMatch" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => <main className="mx-auto max-w-6xl px-4 py-20"><h1 className="font-display text-4xl font-bold">Model not found</h1><Link to="/" className="underline">Back to leaderboard</Link></main>,
  component: Detail,
});

function Detail() {
  const m = Route.useLoaderData();
  const { data: { models: MODELS } } = useSuspenseQuery(modelsQuery);
  const p = PROVIDERS[m.provider]!;
  const rank = [...MODELS].sort((a, b) => overall(b) - overall(a)).findIndex((x) => x.id === m.id) + 1;
  const stats = [["Input /1M", fmtUsd(m.inputPrice)], ["Output /1M", fmtUsd(m.outputPrice)], ["Context", fmtCtx(m.context)], ["Speed", m.tokensPerSec ? `${m.tokensPerSec} tok/s` : "—"], ["Released", m.released], ["Weights", m.openWeights ? "Open" : "Closed"]];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid-paper flex flex-col gap-6 rounded-3xl border-2 border-ink bg-card p-8 md:flex-row md:items-center">
        <ProviderLogo provider={p} size={64} />
        <div className="flex-1">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{p.name} · {m.rated ? `rank #${rank} overall` : "skill scores not rated yet"}</p>
          <h1 className="font-display text-5xl font-extrabold tracking-tight">{m.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{m.summary}</p>
        </div>
        <div className="pop grid h-28 w-28 place-items-center rounded-full bg-accent font-display text-4xl font-extrabold">{m.rated ? overall(m) : "new"}</div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-6">
        {stats.map(([k, v]) => <div key={k} className="rounded-2xl border border-border bg-card p-4"><div className="font-mono text-xs uppercase text-muted-foreground">{k}</div><div className="mt-1 font-display text-xl font-bold">{v}</div></div>)}
      </div>
      <h2 className="mt-10 font-display text-2xl font-bold">Skills</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {ACTIVITIES.map((a) => (
          <div key={a.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex justify-between"><span className="font-semibold">{a.label}</span><span className="font-display text-xl font-extrabold">{m.scores[a.id] || "n/a"}</span></div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-ink" style={{ width: `${m.scores[a.id]}%` }} /></div>
          </div>
        ))}
      </div>
      <Link to="/compare" search={{ ids: m.id }} className="pop mt-8 inline-block rounded-full bg-accent px-6 py-3 font-bold">Compare {m.name} with others →</Link>
    </main>
  );
}
