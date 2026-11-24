export type Activity = "coding" | "reasoning" | "writing" | "math" | "vision" | "speed";

export const ACTIVITIES: { id: Activity; label: string; blurb: string }[] = [
  { id: "coding", label: "Coding", blurb: "Writing, fixing and explaining code" },
  { id: "reasoning", label: "Reasoning", blurb: "Multi-step logic and hard questions" },
  { id: "writing", label: "Writing", blurb: "Essays, emails, creative text" },
  { id: "math", label: "Math", blurb: "Competition maths and calculation" },
  { id: "vision", label: "Vision", blurb: "Understanding images and charts" },
  { id: "speed", label: "Speed", blurb: "How fast answers stream back" },
];

export type Provider = { id: string; name: string; logo: string; hue: number };

const icon = (slug: string) => `https://unpkg.com/@lobehub/icons-static-svg@1.75.0/icons/${slug}.svg`;

export const PROVIDERS: Record<string, Provider> = {
  openai: { id: "openai", name: "OpenAI", logo: icon("openai"), hue: 160 },
  anthropic: { id: "anthropic", name: "Anthropic", logo: icon("anthropic"), hue: 45 },
  google: { id: "google", name: "Google", logo: icon("gemini-color"), hue: 250 },
  meta: { id: "meta", name: "Meta", logo: icon("meta-color"), hue: 230 },
  mistral: { id: "mistral", name: "Mistral", logo: icon("mistral-color"), hue: 55 },
  deepseek: { id: "deepseek", name: "DeepSeek", logo: icon("deepseek-color"), hue: 260 },
  xai: { id: "xai", name: "xAI", logo: icon("grok"), hue: 0 },
  alibaba: { id: "alibaba", name: "Alibaba", logo: icon("qwen-color"), hue: 280 },
};

export type Model = {
  id: string;
  name: string;
  provider: keyof typeof PROVIDERS;
  released: string;
  context: number; // tokens
  inputPrice: number; // USD per 1M tokens
  outputPrice: number;
  openWeights: boolean;
  multimodal: boolean;
  tokensPerSec: number;
  scores: Record<Activity, number>; // 0-100, 0 = not rated
  rated: boolean;
  summary: string;
};

/** Raw entry from the public OpenRouter model list. */
export type RawModel = { id: string; name: string; created: number; description?: string; context_length?: number;
  pricing?: { prompt?: string; completion?: string }; architecture?: { input_modalities?: string[] } };

const PREFIX: Record<string, keyof typeof PROVIDERS> = { openai: "openai", anthropic: "anthropic", google: "google", "meta-llama": "meta",
  mistralai: "mistral", deepseek: "deepseek", "x-ai": "xai", qwen: "alibaba" };
const OPEN = new Set(["meta", "deepseek", "alibaba"]);
const PER_PROVIDER = 6;

/** Turn the live list into our models: newest few per provider, newest first. */
export function mapLive(raw: RawModel[]): Model[] {
  const seen: Record<string, number> = {};
  const out: Model[] = [];
  for (const r of [...raw].sort((a, b) => b.created - a.created)) {
    const [pre] = r.id.split("/");
    const provider = PREFIX[pre ?? ""];
    if (!provider || r.id.includes(":") || /free|preview-\d|image|tts|audio|embed/i.test(r.id)) continue;
    const inP = Number(r.pricing?.prompt ?? 0) * 1e6, outP = Number(r.pricing?.completion ?? 0) * 1e6;
    if (!(inP > 0) || !(outP > 0)) continue;
    if ((seen[provider] = (seen[provider] ?? 0) + 1) > PER_PROVIDER) continue;
    const id = r.id.replace("/", "--");
    const known = MODELS.find((m) => m.id === id);
    out.push({ id, name: r.name.replace(/^[^:]+:\s*/, ""), provider, released: new Date(r.created * 1000).toISOString().slice(0, 10),
      context: r.context_length ?? 0, inputPrice: inP, outputPrice: outP,
      openWeights: known?.openWeights ?? (OPEN.has(provider) || /oss|gemma|open/i.test(r.id)),
      multimodal: (r.architecture?.input_modalities ?? []).includes("image"), tokensPerSec: known?.tokensPerSec ?? 0,
      scores: known?.scores ?? { coding: 0, reasoning: 0, writing: 0, math: 0, vision: 0, speed: 0 }, rated: !!known,
      summary: (r.description ?? "").split(/(?<=\.)\s/)[0]?.slice(0, 160) ?? "" });
  }
  return out;
}

/** Hand-entered benchmark estimates, used for scores when a live model matches. */
export const MODELS: Model[] = [
  { id: "openai--gpt-5", rated: true, name: "GPT-5", provider: "openai", released: "2025-08", context: 400000, inputPrice: 1.25, outputPrice: 10, openWeights: false, multimodal: true, tokensPerSec: 95,
    scores: { coding: 93, reasoning: 95, writing: 90, math: 96, vision: 90, speed: 62 }, summary: "OpenAI's flagship all-rounder with adaptive reasoning." },
  { id: "openai--gpt-5-mini", rated: true, name: "GPT-5 mini", provider: "openai", released: "2025-08", context: 400000, inputPrice: 0.25, outputPrice: 2, openWeights: false, multimodal: true, tokensPerSec: 140,
    scores: { coding: 84, reasoning: 86, writing: 82, math: 89, vision: 83, speed: 80 }, summary: "Cheaper, faster GPT-5 with most of the smarts." },
  { id: "openai--gpt-oss-120b", rated: true, name: "gpt-oss-120b", provider: "openai", released: "2025-08", context: 131000, inputPrice: 0.15, outputPrice: 0.6, openWeights: true, multimodal: false, tokensPerSec: 260,
    scores: { coding: 78, reasoning: 82, writing: 72, math: 88, vision: 0, speed: 95 }, summary: "Open-weight reasoning model you can run yourself." },
  { id: "anthropic--claude-opus-4.1", rated: true, name: "Claude Opus 4.1", provider: "anthropic", released: "2025-08", context: 200000, inputPrice: 15, outputPrice: 75, openWeights: false, multimodal: true, tokensPerSec: 45,
    scores: { coding: 95, reasoning: 90, writing: 94, math: 85, vision: 84, speed: 40 }, summary: "Anthropic's most capable model for deep agentic work." },
  { id: "anthropic--claude-sonnet-4.5", rated: true, name: "Claude Sonnet 4.5", provider: "anthropic", released: "2025-09", context: 1000000, inputPrice: 3, outputPrice: 15, openWeights: false, multimodal: true, tokensPerSec: 70,
    scores: { coding: 96, reasoning: 89, writing: 93, math: 86, vision: 85, speed: 58 }, summary: "Top-tier coding model with a huge context window." },
  { id: "anthropic--claude-haiku-4.5", rated: true, name: "Claude Haiku 4.5", provider: "anthropic", released: "2025-10", context: 200000, inputPrice: 1, outputPrice: 5, openWeights: false, multimodal: true, tokensPerSec: 150,
    scores: { coding: 86, reasoning: 78, writing: 84, math: 74, vision: 76, speed: 84 }, summary: "Small, fast Claude that still codes well." },
  { id: "google--gemini-2.5-pro", rated: true, name: "Gemini 2.5 Pro", provider: "google", released: "2025-06", context: 1000000, inputPrice: 1.25, outputPrice: 10, openWeights: false, multimodal: true, tokensPerSec: 150,
    scores: { coding: 89, reasoning: 92, writing: 89, math: 92, vision: 95, speed: 76 }, summary: "Excellent vision and long-document understanding." },
  { id: "google--gemini-2.5-flash", rated: true, name: "Gemini 2.5 Flash", provider: "google", released: "2025-06", context: 1000000, inputPrice: 0.3, outputPrice: 2.5, openWeights: false, multimodal: true, tokensPerSec: 230,
    scores: { coding: 80, reasoning: 83, writing: 82, math: 85, vision: 89, speed: 92 }, summary: "Best value for fast, multimodal everyday tasks." },
  { id: "meta-llama--llama-4-maverick", rated: true, name: "Llama 4 Maverick", provider: "meta", released: "2025-04", context: 1000000, inputPrice: 0.2, outputPrice: 0.6, openWeights: true, multimodal: true, tokensPerSec: 160,
    scores: { coding: 72, reasoning: 74, writing: 78, math: 70, vision: 80, speed: 86 }, summary: "Meta's open multimodal model, cheap to host." },
  { id: "mistralai--mistral-medium-3", rated: true, name: "Mistral Medium 3", provider: "mistral", released: "2025-05", context: 128000, inputPrice: 0.4, outputPrice: 2, openWeights: false, multimodal: true, tokensPerSec: 110,
    scores: { coding: 77, reasoning: 75, writing: 80, math: 74, vision: 77, speed: 74 }, summary: "European model balancing cost and quality." },
  { id: "deepseek--deepseek-chat-v3.1", rated: true, name: "DeepSeek V3.1", provider: "deepseek", released: "2025-08", context: 128000, inputPrice: 0.27, outputPrice: 1.1, openWeights: true, multimodal: false, tokensPerSec: 60,
    scores: { coding: 85, reasoning: 86, writing: 80, math: 90, vision: 0, speed: 55 }, summary: "Open-weight powerhouse at a tiny price." },
  { id: "x-ai--grok-4", rated: true, name: "Grok 4", provider: "xai", released: "2025-07", context: 256000, inputPrice: 3, outputPrice: 15, openWeights: false, multimodal: true, tokensPerSec: 50,
    scores: { coding: 87, reasoning: 94, writing: 84, math: 94, vision: 80, speed: 44 }, summary: "Heavy reasoner strong on science and maths." },
  { id: "qwen--qwen3-235b-a22b", rated: true, name: "Qwen3 235B", provider: "alibaba", released: "2025-07", context: 262000, inputPrice: 0.22, outputPrice: 0.88, openWeights: true, multimodal: false, tokensPerSec: 90,
    scores: { coding: 83, reasoning: 85, writing: 79, math: 89, vision: 0, speed: 66 }, summary: "Alibaba's open flagship, strong multilingual." },
];

export const getModel = (list: Model[], id: string) => list.find((m) => m.id === id);

/** Blended price per 1M tokens assuming 3 input : 1 output. */
export const blendedPrice = (m: Model) => (m.inputPrice * 3 + m.outputPrice) / 4;

/** Cost of a workload in USD. */
export const workloadCost = (m: Model, inputTokens: number, outputTokens: number) =>
  (m.inputPrice * inputTokens + m.outputPrice * outputTokens) / 1_000_000;

export const overall = (m: Model) => {
  const s = Object.values(m.scores).filter((v) => v > 0);
  if (!s.length) return 0;
  return Math.round(s.reduce((a, b) => a + b, 0) / s.length);
};

export const fmtCtx = (n: number) => (n >= 1_000_000 ? `${n / 1_000_000}M` : `${Math.round(n / 1000)}K`);
export const fmtUsd = (n: number) => (n < 0.01 ? `$${n.toFixed(4)}` : n < 1 ? `$${n.toFixed(3)}` : `$${n.toFixed(2)}`);

/** Entry from the Artificial Analysis language model list. */
export type AaModel = { slug: string; evaluations?: { artificial_analysis_intelligence_index?: number | null; artificial_analysis_coding_index?: number | null };
  performance?: { median_output_tokens_per_second?: number | null } };

const VARIANT = /^(-(non-reasoning|reasoning|minimal|low|medium|high|xhigh|max|thinking))*$/;

/** Fill in scores from Artificial Analysis benchmarks. Indexes are scaled so the best model in the list scores 100. */
export function applyBenchmarks(models: Model[], aa: AaModel[]): Model[] {
  const scored = aa.filter((a) => a.evaluations?.artificial_analysis_intelligence_index != null);
  if (!scored.length) return models;
  const maxOf = (f: (a: AaModel) => number | null | undefined) => Math.max(1, ...scored.map((a) => f(a) ?? 0));
  const maxI = maxOf((a) => a.evaluations?.artificial_analysis_intelligence_index);
  const maxC = maxOf((a) => a.evaluations?.artificial_analysis_coding_index);
  const maxS = maxOf((a) => a.performance?.median_output_tokens_per_second);
  return models.map((m) => {
    const key = (m.id.split("--")[1] ?? m.id).replace(/\./g, "-").toLowerCase();
    const hits = scored.filter((a) => a.slug === key || (a.slug.startsWith(key + "-") && VARIANT.test(a.slug.slice(key.length))));
    if (!hits.length) return m;
    const best = hits.reduce((a, b) => ((b.evaluations!.artificial_analysis_intelligence_index ?? 0) > (a.evaluations!.artificial_analysis_intelligence_index ?? 0) ? b : a));
    const pct = (v: number | null | undefined, max: number) => (v ? Math.round((v / max) * 100) : 0);
    const tps = best.performance?.median_output_tokens_per_second ?? 0;
    return { ...m, rated: true, tokensPerSec: tps ? Math.round(tps) : m.tokensPerSec,
      scores: { coding: pct(best.evaluations?.artificial_analysis_coding_index, maxC), reasoning: pct(best.evaluations?.artificial_analysis_intelligence_index, maxI),
        writing: 0, math: 0, vision: 0, speed: pct(tps, maxS) } };
  });
}
