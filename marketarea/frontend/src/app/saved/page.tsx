"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  listSavedAnalyses,
  deleteSavedAnalysis,
  SavedAnalysisItem,
} from "@/lib/saved-api";

export default function SavedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<SavedAnalysisItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listSavedAnalyses(50, 0);
      setItems(data.items);
      setTotal(data.total);
    } catch {
      console.error("Failed to load saved analyses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchItems();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, fetchItems]);

  const handleDelete = useCallback(
    async (id: number) => {
      setDeleting(id);
      try {
        await deleteSavedAnalysis(id);
        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => prev - 1);
      } catch {
        console.error("Delete failed");
      } finally {
        setDeleting(null);
      }
    },
    []
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "#22c55e";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div
      className="min-h-[100dvh] flex flex-col"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Header */}
      <header
        className="flex-shrink-0 border-b safe-top"
        style={{
          backgroundColor: "var(--bg-overlay)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="p-2 -ml-2 rounded-full transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="material-icons">arrow_back</span>
          </button>
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            저장된 분석
          </h1>
          <span
            className="text-sm ml-auto"
            style={{ color: "var(--text-muted)" }}
          >
            {total}건
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          {status === "loading" || loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                불러오는 중...
              </p>
            </div>
          ) : !session ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <span
                className="material-icons text-5xl"
                style={{ color: "var(--text-muted)" }}
              >
                lock
              </span>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                로그인 후 저장된 분석을 확인할 수 있습니다.
              </p>
              <button
                onClick={() => signIn("google")}
                className="h-10 px-6 rounded-full bg-primary text-white text-sm font-semibold flex items-center gap-2"
              >
                <span className="material-icons text-lg">login</span>
                Google 로그인
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span
                className="material-icons text-5xl"
                style={{ color: "var(--text-muted)" }}
              >
                bookmark_border
              </span>
              <p
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                아직 저장된 분석이 없습니다.
              </p>
              <button
                onClick={() => router.push("/")}
                className="h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold"
              >
                분석 시작하기
              </button>
            </div>
          ) : (
            items.map((item) => {
              const score = (item.result_json as { health_score?: number })
                .health_score ?? 0;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border p-4 transition-colors"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="material-icons text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          location_on
                        </span>
                        <span
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {item.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className="px-1.5 py-0.5 rounded border" style={{ borderColor: "var(--border-color)" }}>
                          {item.industry_name}
                        </span>
                        <span>반경 {item.radius}m</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: getScoreColor(score) }}
                      >
                        {Math.round(score)}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        점
                      </span>
                    </div>
                  </div>

                  {item.memo && (
                    <p
                      className="text-xs mt-2 p-2 rounded-lg line-clamp-2"
                      style={{
                        color: "var(--text-secondary)",
                        backgroundColor: "var(--bg-card-alt)",
                      }}
                    >
                      {item.memo}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
                    <span
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {formatDate(item.created_at)}
                    </span>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70 disabled:opacity-30"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <span className="material-icons text-lg">
                        {deleting === item.id ? "hourglass_empty" : "delete_outline"}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
