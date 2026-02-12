export interface SaveAnalysisPayload {
  address: string;
  industry_code: string;
  industry_name: string;
  lat: number;
  lng: number;
  radius: number;
  result_json: Record<string, unknown>;
  memo?: string;
}

export interface SavedAnalysisItem {
  id: number;
  address: string;
  industry_code: string;
  industry_name: string;
  lat: number;
  lng: number;
  radius: number;
  result_json: Record<string, unknown>;
  memo: string | null;
  created_at: string;
}

export interface SavedAnalysisListResponse {
  items: SavedAnalysisItem[];
  total: number;
}

export async function saveAnalysis(
  payload: SaveAnalysisPayload
): Promise<SavedAnalysisItem> {
  const res = await fetch("/api/saved-analyses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Save failed: ${res.status}`);
  }
  return res.json();
}

export async function listSavedAnalyses(
  limit = 20,
  offset = 0
): Promise<SavedAnalysisListResponse> {
  const res = await fetch(
    `/api/saved-analyses?limit=${limit}&offset=${offset}`
  );
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`List failed: ${res.status}`);
  }
  return res.json();
}

export async function deleteSavedAnalysis(id: number): Promise<void> {
  const res = await fetch(`/api/saved-analyses/${id}`, { method: "DELETE" });
  if (!res.ok) {
    if (res.status === 401) throw new Error("UNAUTHORIZED");
    throw new Error(`Delete failed: ${res.status}`);
  }
}
