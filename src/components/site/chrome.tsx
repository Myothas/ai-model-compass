import { Link } from "@tanstack/react-router";
import { PROVIDERS, type Provider } from "@/data/models";

export function ProviderLogo({ provider, size = 28 }: { provider: Provider; size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-lg border border-border bg-card" style={{ width: size + 12, height: size + 12 }}>
      <img src={provider.logo} alt={`${provider.name} logo`} width={size} height={size} loading="lazy" />
    </span>
  );
}

export function SiteHeader() {
  const link = "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground";
  const active = { className: "rounded-full px-4 py-2 text-sm font-medium bg-ink text-ink-foreground" };
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent pop text-sm">MM</span>
          ModelMatch
        </Link>
        <nav className="flex items-center gap-1">
          <Link to="/" className={link} activeProps={active} activeOptions={{ exact: true }}>Leaderboard</Link>
          <Link to="/compare" search={{ ids: undefined }} className={link} activeProps={active}>Compare</Link>
          <Link to="/calculator" className={link} activeProps={active}>Cost calculator</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const list = Object.values(PROVIDERS);
  return (
    <footer className="mt-24 border-t border-border">
      <div className="overflow-hidden py-6">
        <div className="flex w-max animate-marquee gap-12">
          {[...list, ...list].map((p, i) => (
            <span key={i} className="flex items-center gap-3 font-display text-2xl font-bold text-muted-foreground">
              <img src={p.logo} alt="" width={28} height={28} /> {p.name}
            </span>
          ))}
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-8 font-mono text-xs text-muted-foreground">
        Free and open for everyone. Scores are normalised 0–100 estimates from public benchmarks; prices in USD per 1M tokens and may change.
      </p>
    </footer>
  );
}
