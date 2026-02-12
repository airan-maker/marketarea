"use client";

import { useState, useRef, useCallback } from "react";
import { AnalysisResult } from "@/types/analysis";
import HealthScoreCard, { getGrade } from "./HealthScoreCard";
import MetricCard from "./MetricCard";

interface BottomSheetProps {
  result: AnalysisResult | null;
  loading: boolean;
  address: string;
  industryName: string;
  onViewDetail: () => void;
}

function formatSales(val: number): string {
  if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
  if (val >= 1) return `₩${Math.round(val).toLocaleString()}만`;
  return "₩0";
}

function competitionLevel(index: number): { text: string; color: string } {
  if (index < 0.8) return { text: "Low", color: "#22c55e" };
  if (index < 1.5) return { text: "Mod.", color: "#f59e0b" };
  return { text: "High", color: "#f97316" };
}

export default function BottomSheet({
  result,
  loading,
  address,
  industryName,
  onViewDetail,
}: BottomSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const diff = startY.current - e.changedTouches[0].clientY;
    if (diff > 50) setExpanded(true);
    if (diff < -50) setExpanded(false);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-sheet border-t p-6 animate-slide-up"
        style={{ backgroundColor: "var(--bg-sheet)", borderColor: "var(--border-color)" }}
      >
        <div className="w-full flex justify-center mb-4">
          <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-card-alt)" }} />
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>상권 분석 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!result) {
    return (
      <div
        className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-sheet border-t animate-slide-up"
        style={{ backgroundColor: "var(--bg-sheet)", borderColor: "var(--border-color)" }}
      >
        <div className="w-full flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full drag-handle" style={{ backgroundColor: "var(--bg-card-alt)" }} />
        </div>
        <div className="px-6 py-4 pb-8">
          <div className="flex items-center justify-center h-24" style={{ color: "var(--text-muted)" }}>
            <div className="text-center">
              <span className="material-icons text-3xl mb-2 block" style={{ color: "var(--text-muted)" }}>touch_app</span>
              <p className="text-sm">업종을 선택하면 상권 분석이 시작됩니다</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const comp = competitionLevel(result.competition_index);
  const grade = getGrade(result.health_score);

  return (
    <div
      ref={sheetRef}
      className={`absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-sheet border-t flex flex-col transition-all duration-300 ease-out animate-slide-up ${
        expanded ? "max-h-[80vh]" : "max-h-[55vh]"
      }`}
      style={{ backgroundColor: "var(--bg-sheet)", borderColor: "var(--border-color)" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div
        className="w-full flex justify-center pt-3 pb-1 cursor-grab"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-12 h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-card-alt)" }} />
      </div>

      {/* Header */}
      <div className="px-6 py-2 flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
            {address} 상권
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {industryName} / {result.grid_count}개 격자 분석
          </p>
        </div>
        <div className={`${grade.bgColor} ${grade.color} border px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide`}>
          {grade.text}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar">
        {/* Health Score */}
        <div className="mt-3">
          <HealthScoreCard
            score={result.health_score}
            percentile={result.health_score >= 80 ? "서울 상위 5%" : result.health_score >= 60 ? "서울 상위 20%" : undefined}
          />
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <MetricCard
            icon="directions_walk"
            label="유동인구"
            value={`${Math.round(result.floating_population).toLocaleString()}`}
            subtitle="일평균"
          />
          <MetricCard
            icon="payments"
            label="예상 매출"
            value={formatSales(result.sales_estimate_high)}
            subtitle="월 추정"
          />
          <MetricCard
            icon="apartment"
            label="거주인구"
            value={`${result.resident_population.toLocaleString()}`}
            subtitle="세대"
          />
          <MetricCard
            icon="storefront"
            label="경쟁 강도"
            value={comp.text}
            subtitle={`동일업종 ${result.store_count}개`}
            valueColor={comp.color}
          />
        </div>

        {/* Risk Flags */}
        {result.risk_flags.length > 0 && (
          <div className="mt-4 space-y-2">
            {result.risk_flags.map((flag, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg text-sm flex items-start gap-2 border ${
                  flag.level === "danger"
                    ? "text-red-400 border-red-500/20"
                    : "text-amber-400 border-amber-500/20"
                }`}
                style={{ backgroundColor: flag.level === "danger" ? "var(--risk-danger-bg)" : "var(--risk-warning-bg)" }}
              >
                <span className="material-icons text-sm mt-0.5">
                  {flag.level === "danger" ? "error" : "warning"}
                </span>
                {flag.message}
              </div>
            ))}
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={onViewDetail}
          className="w-full mt-6 bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center transition-colors active:scale-[0.98]"
        >
          상세 분석 리포트 보기
          <span className="material-icons ml-2 text-sm">arrow_forward</span>
        </button>

        {/* Safe area spacer */}
        <div className="h-6" />
      </div>
    </div>
  );
}
