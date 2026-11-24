import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { MODELS, applyBenchmarks, mapLive, type AaModel, type Model, type RawModel } from "./models";

const AA_GATEWAY = "https://connector-gateway.lovable.dev/udc_artificial_analysis_4";

async function fetchBenchmarks(): Promise<AaModel[]> {
  const lovableKey = process.env["LOVABLE_API_KEY"], aaKey = process.env["UDC_ARTIFICIAL_ANALYSIS_4_API_KEY"];
  if (!lovableKey || !aaKey) { console.error("benchmark keys missing"); return []; }
  const out: AaModel[] = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(`${AA_GATEWAY}/language/models/free?page=${page}`, { headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": aaKey } });
    if (!res.ok) { console.error(`benchmarks failed [${res.status}]: ${await res.text()}`); break; }
    const body = (await res.json()) as { data: AaModel[]; pagination?: { has_more?: boolean } };
    out.push(...body.data);
    if (!body.pagination?.has_more) break;
  }
  return out;
}

export const fetchLiveModels = createServerFn({ method: "GET" }).handler(async (): Promise<{ models: Model[]; live: boolean; benchmarks: boolean; fetchedAt: string }> => {
  const fetchedAt = new Date().toISOString();
  try {
    const [res, aa] = await Promise.all([fetch("https://openrouter.ai/api/v1/models"), fetchBenchmarks().catch((e) => { console.error(e); return []; })]);
    if (!res.ok) throw new Error(String(res.status));
    const { data } = (await res.json()) as { data: RawModel[] };
    const models = applyBenchmarks(mapLive(data), aa);
    if (models.length) return { models, live: true, benchmarks: aa.length > 0, fetchedAt };
  } catch (e) { console.error("live models failed", e); }
  return { models: MODELS, live: false, benchmarks: false, fetchedAt };
});

export const modelsQuery = queryOptions({ queryKey: ["models"], queryFn: () => fetchLiveModels(), staleTime: 60 * 60 * 1000 });
