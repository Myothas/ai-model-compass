import { describe, it, expect } from "vitest";
import { MODELS, workloadCost, blendedPrice } from "./models";
const gpt5 = MODELS.find((m) => m.id === "gpt-5")!;
describe("pricing", () => {
  it("workload cost uses per-million prices", () => { expect(workloadCost(gpt5, 1_000_000, 1_000_000)).toBeCloseTo(11.25); });
  it("blended price weights input 3:1", () => { expect(blendedPrice(gpt5)).toBeCloseTo(3.4375); });
});
