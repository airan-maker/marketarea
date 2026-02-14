import { AnalysisRequest, AnalysisResult, IndustryItem } from "@/types/analysis";

const BASE_URL = "/api/proxy";

export async function runAnalysis(req: AnalysisRequest): Promise<AnalysisResult> {
  const res = await fetch(`${BASE_URL}/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Analysis failed (${res.status}): ${detail}`);
  }
  return res.json();
}

export async function getIndustries(): Promise<IndustryItem[]> {
  const res = await fetch(`${BASE_URL}/industries`);
  if (!res.ok) throw new Error(`Failed to load industries: ${res.status}`);
  return res.json();
}
