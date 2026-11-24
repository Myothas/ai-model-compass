import { describe, it, expect } from "vitest";
import { MODELS, workloadCost, blendedPrice, mapLive, applyBenchmarks } from "./models";
const gpt5 = MODELS.find((m) => m.id === "openai--gpt-5")!;
describe("pricing", () => {
  it("workload cost uses per-million prices", () => { expect(workloadCost(gpt5, 1_000_000, 1_000_000)).toBeCloseTo(11.25); });
  it("blended price weights input 3:1", () => { expect(blendedPrice(gpt5)).toBeCloseTo(3.4375); });
});
describe("live models", () => {
  const raw = (id: string, created: number) => ({ id, name: "X: " + id, created, pricing: { prompt: "0.000001", completion: "0.000002" } });
  it("lists newest first and converts prices to per million", () => {
    const out = mapLive([raw("openai/old", 1), raw("openai/new", 2)]);
    expect(out.map((m) => m.id)).toEqual(["openai--new", "openai--old"]);
    expect(out[0]!.inputPrice).toBeCloseTo(1);
  });
  it("skips unknown providers and :variants", () => {
    expect(mapLive([raw("acme/x", 1), raw("openai/x:free", 2)])).toEqual([]);
  });
  it("reuses hand-entered scores for matching models", () => {
    expect(mapLive([raw("openai/gpt-5", 1)])[0]!.rated).toBe(true);
  });
});
describe("benchmarks", () => {
  const base = mapLive([{ id: "openai/gpt-9", name: "OpenAI: GPT-9", created: 1, pricing: { prompt: "0.000001", completion: "0.000002" } }]);
  const aa = (slug: string, i: number) => ({ slug, evaluations: { artificial_analysis_intelligence_index: i }, performance: { median_output_tokens_per_second: 100 } });
  it("matches effort variants and keeps the best score", () => {
    const [m] = applyBenchmarks(base, [aa("gpt-9-low", 25), aa("gpt-9-xhigh", 50)]);
    expect(m!.rated).toBe(true);
    expect(m!.scores.reasoning).toBe(100);
  });
  it("does not match a different model with the same prefix", () => {
    expect(applyBenchmarks(base, [aa("gpt-9-mini", 50)])[0]!.rated).toBe(false);
  });
});

describe("overall score", () => {
  it("ignores speed", async () => {
    const { overall } = await import("./models");
    const m = { scores: { coding: 60, reasoning: 80, writing: 0, math: 0, vision: 0, speed: 100 } } as never;
    expect(overall(m)).toBe(70);
  });
});
