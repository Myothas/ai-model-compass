import { describe, it, expect } from "vitest";
import { MODELS, workloadCost, blendedPrice, mapLive } from "./models";
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
