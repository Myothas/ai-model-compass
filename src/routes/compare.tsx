import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { modelsQuery } from "@/data/live.functions";
import { ACTIVITIES, PROVIDERS, type Model, fmtCtx, fmtUsd, getModel, overall } from "@/data/models";
import { ProviderLogo } from "@/components/site/chrome";

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): { ids: string | undefined } => ({ ids: typeof s["ids"] === "string" ? s["ids"] : undefined }),
  head: () => ({
    meta: [
      { title: "Compare AI models side by side — ModelMatch" },
      { name: "description", content: "Put up to four AI models head to head on skills, price, speed and context." },
      { property: "og:title", content: "Compare AI models — ModelMatch" },
      { property: "og:description", content: "Side-by-side AI model comparison with skill radar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(modelsQuery),
  component: Compare,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];

function Radar({ models }: { models: Model[] }) {
  const R = 120, c = 150, n = ACTIVITIES.length;
  const pt = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)] as const;
  };
  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-sm">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={ACTIVITIES.map((_, i) => pt(i, r).join(",")).join(" ")} fill="none" stroke="var(--border)" />
      ))}
      {ACTIVITIES.map((a, i) => { const [x, y] = pt(i, 118); return <text key={a.id} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground font-mono text-[10px]">{a.label}</text>; })}
      {models.map((m, k) => {
        const vals = ACTIVITIES.map((a) => m.scores[a.id]);
        if (!vals.some((v) => v > 0)) return null;
        // Floor unrated axes at a small radius so the shape stays visible instead of collapsing to a point.
        return <polygon key={m.id} points={vals.map((v, i) => pt(i, Math.max(v, 6)).join(",")).join(" ")} fill={COLORS[k]} fillOpacity={0.25} stroke={COLORS[k]} strokeWidth={2.5} />;
      })}
    </svg>
  );
}

function Compare() {
  const { ids } = Route.useSearch();
  const navigate = useNavigate({ from: "/compare" });
  const { data: { models: MODELS } } = useSuspenseQuery(modelsQuery);
  const chosen = (ids ? ids.split(",") : (["openai", "anthropic", "google"] as const).map((p) => MODELS.find((m) => m.provider === p)?.id ?? "")).map((id) => getModel(MODELS, id)).filter((m): m is NonNullable<typeof m> => !!m).slice(0, 4);
  const set = (list: string[]) => navigate({ search: { ids: list.join(",") || undefined } });
  const best = (f: (m: (typeof chosen)[number]) => number, low = false) => { const v = chosen.map(f); return low ? Math.min(...v) : Math.max(...v); };

  const rows: { label: string; get: (m: (typeof chosen)[number]) => number; show: (v: number) => string; low?: boolean }[] = [
    { label: "Overall", get: (m) => (m.rated ? overall(m) : 0), show: (v) => (v ? String(v) : "not rated") },
    { label: "Released", get: (m) => Date.parse(m.released), show: (v) => new Date(v).toISOString().slice(0, 10) },
    ...ACTIVITIES.map((a) => ({ label: a.label, get: (m: (typeof chosen)[number]) => m.scores[a.id], show: (v: number) => (v ? String(v) : "—") })),
    { label: "Input /1M", get: (m) => m.inputPrice, show: fmtUsd, low: true },
    { label: "Output /1M", get: (m) => m.outputPrice, show: fmtUsd, low: true },
    { label: "Context", get: (m) => m.context, show: fmtCtx },
    { label: "Tokens/sec", get: (m) => m.tokensPerSec, show: (v) => (v ? String(v) : "—") },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-5xl font-extrabold tracking-tight">Head to head</h1>
      <p className="mt-2 text-muted-foreground">Add up to four models. Winners in each row are highlighted.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {MODELS.map((m) => {
          const on = chosen.some((c) => c.id === m.id);
          return (
            <button key={m.id} onClick={() => set(on ? chosen.filter((c) => c.id !== m.id).map((c) => c.id) : chosen.length < 4 ? [...chosen.map((c) => c.id), m.id] : chosen.map((c) => c.id))}
              className={`flex items-center gap-2 rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold ${on ? "bg-ink text-ink-foreground" : "bg-card hover:bg-accent"}`}>
              <img src={PROVIDERS[m.provider]!.logo} alt="" width={14} height={14} /> {m.name}
            </button>
          );
        })}
      </div>

      {chosen.length === 0 ? <p className="mt-10 text-muted-foreground">Pick a model above to start.</p> : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[auto_1fr]">
          <div className="pop rounded-3xl bg-card p-6">
            <Radar models={chosen} />
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {chosen.map((m, k) => <span key={m.id} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[k] }} />{m.name}</span>)}
            </div>
            {chosen.some((m) => !Object.values(m.scores).some((v) => v > 0)) && (
              <p className="mt-3 max-w-sm text-xs text-muted-foreground">Models with no shape aren't rated yet — benchmark scores arrive a few days after release.</p>
            )}
          </div>
          <div className="overflow-x-auto rounded-3xl border-2 border-ink bg-card">
            <table className="w-full text-sm">
              <thead><tr className="border-b-2 border-ink">
                <th />
                {chosen.map((m) => <th key={m.id} className="p-4 text-left"><div className="flex items-center gap-2"><ProviderLogo provider={PROVIDERS[m.provider]!} size={20} /><span className="font-display text-base font-bold">{m.name}</span></div></th>)}
              </tr></thead>
              <tbody>
                {rows.map((r) => { const b = best(r.get, r.low); return (
                  <tr key={r.label} className="border-b border-border last:border-0">
                    <td className="p-3 font-mono text-xs uppercase text-muted-foreground">{r.label}</td>
                    {chosen.map((m) => { const v = r.get(m); return <td key={m.id} className="p-3"><span className={`rounded-md px-2 py-0.5 font-semibold ${v === b && chosen.length > 1 ? "bg-accent" : ""}`}>{r.show(v)}</span></td>; })}
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
