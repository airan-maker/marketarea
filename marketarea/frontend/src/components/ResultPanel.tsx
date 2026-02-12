"use client";

import { AnalysisResult } from "@/types/analysis";
import HealthGauge from "./HealthGauge";
import ScoreCard from "./ScoreCard";

interface ResultPanelProps {
  result: AnalysisResult | null;
  loading: boolean;
}

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}억`;
  if (n >= 1) return `${Math.round(n).toLocaleString()}만`;
  return "0";
}

function competitionLabel(index: number): { text: string; color: "green" | "amber" | "red" } {
  if (index < 0.8) return { text: "낮음", color: "green" };
  if (index < 1.5) return { text: "보통", color: "amber" };
  return { text: "높음", color: "red" };
}

export default function ResultPanel({ result, loading }: ResultPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">상권 분석 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
              />
            </svg>
            <p className="text-sm">지도에서 위치를 클릭하거나</p>
            <p className="text-sm">주소를 검색한 후 업종을 선택하세요</p>
          </div>
        </div>
      </div>
    );
  }

  const comp = competitionLabel(result.competition_index);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      {/* 건강도 게이지 */}
      <HealthGauge score={result.health_score} />

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard
          title="경쟁 강도"
          value={`${result.competition_index.toFixed(2)}x`}
          subtitle={comp.text}
          color={comp.color}
        />
        <ScoreCard
          title="생존 확률"
          value={`${(result.survival_probability * 100).toFixed(1)}%`}
          subtitle="3년 기준"
          color={result.survival_probability >= 0.7 ? "green" : result.survival_probability >= 0.5 ? "amber" : "red"}
        />
        <ScoreCard
          title="예상 월매출"
          value={`${formatNumber(result.sales_estimate_low)}~${formatNumber(result.sales_estimate_high)}`}
          subtitle="원 (추정)"
          color="blue"
        />
        <ScoreCard
          title="동일업종 점포"
          value={`${result.store_count}개`}
          subtitle={`반경 내 (${result.grid_count}개 격자)`}
          color="gray"
        />
      </div>

      {/* 세부 점수 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">세부 점수</h3>
        <div className="space-y-2">
          <ScoreBar label="유동인구" score={result.floating_score} detail={`일평균 ${result.floating_population.toLocaleString()}명`} />
          <ScoreBar label="거주인구" score={result.population_score} detail={`${result.resident_population.toLocaleString()}명`} />
          <ScoreBar label="임대료" score={result.rent_score} detail={`${result.avg_rent_per_m2.toLocaleString()}원/m2`} />
        </div>
      </div>

      {/* 리스크 경고 */}
      {result.risk_flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">리스크 경고</h3>
          {result.risk_flags.map((flag, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-sm ${
                flag.level === "danger"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              <span className="font-medium">
                {flag.level === "danger" ? "!!" : "!"}{" "}
              </span>
              {flag.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score, detail }: { label: string; score: number; detail: string }) {
  const color =
    score >= 70 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : score >= 30 ? "bg-orange-500" : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>{label}</span>
        <span>{detail}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
    </div>
  );
}
