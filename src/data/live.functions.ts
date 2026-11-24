import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { MODELS, mapLive, type Model, type RawModel } from "./models";

export const fetchLiveModels = createServerFn({ method: "GET" }).handler(async (): Promise<{ models: Model[]; live: boolean; fetchedAt: string }> => {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    if (!res.ok) throw new Error(String(res.status));
    const { data } = (await res.json()) as { data: RawModel[] };
    const models = mapLive(data);
    if (models.length) return { models, live: true, fetchedAt: new Date().toISOString() };
  } catch (e) { console.error("live models failed", e); }
  return { models: MODELS, live: false, fetchedAt: new Date().toISOString() };
});

export const modelsQuery = queryOptions({ queryKey: ["models"], queryFn: () => fetchLiveModels(), staleTime: 60 * 60 * 1000 });
