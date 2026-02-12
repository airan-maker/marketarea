"use client";

import { AnalysisResult } from "@/types/analysis";

interface IndustryRecommendationProps {
  result: AnalysisResult;
  currentIndustry: string;
}

interface Recommendation {
  icon: string;
  name: string;
  reason: string;
  score: "high" | "mid" | "low";
}

export default function IndustryRecommendation({
  result,
  currentIndustry,
}: IndustryRecommendationProps) {
  // Generate recommendations based on area characteristics
  const recommendations: Recommendation[] = [];

  // High floating population → good for cafe/fastfood
  if (result.floating_population > 8000) {
    recommendations.push({
      icon: "local_cafe",
      name: "카페/커피전문점",
      reason: "높은 유동인구에 적합",
      score: "high",
    });
  }

  // High resident population → good for daily necessities
  if (result.resident_population > 3000) {
    recommendations.push({
      icon: "store",
      name: "편의점/슈퍼",
      reason: "풍부한 거주인구 수요",
      score: "high",
    });
  }

  // Low competition → opportunity
  if (result.competition_index < 1.0) {
    recommendations.push({
      icon: "restaurant",
      name: "음식점",
      reason: "경쟁이 낮은 블루오션",
      score: "high",
    });
  }

  // Low rent → good for any business
  if (result.rent_score >= 60) {
    recommendations.push({
      icon: "content_cut",
      name: "미용/뷰티",
      reason: "합리적인 임대료",
      score: "mid",
    });
  }

  // High sales area → retail works
  if (result.sales_estimate_high > 3000) {
    recommendations.push({
      icon: "face",
      name: "화장품/뷰티",
      reason: "높은 소비력 지역",
      score: "mid",
    });
  }

  // Default recommendations
  if (recommendations.length < 3) {
    recommendations.push({
      icon: "school",
      name: "학원/교육",
      reason: "안정적 수요 업종",
      score: "low",
    });
  }

  const scoreColors = {
    high: "#22c55e",
    mid: "#137fec",
    low: "#f59e0b",
  };
  const scoreLabels = {
    high: "추천",
    mid: "적합",
    low: "보통",
  };

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>업종 추천</h3>
        <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: "var(--bg-card-alt)", color: "var(--text-muted)" }}>
          AI 분석
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg transition-colors"
            style={{ backgroundColor: "var(--bg-card-alt)" }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${scoreColors[rec.score]}15`, color: scoreColors[rec.score] }}
            >
              <span className="material-icons text-lg">{rec.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rec.name}</p>
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{rec.reason}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0"
              style={{ backgroundColor: `${scoreColors[rec.score]}15`, color: scoreColors[rec.score] }}
            >
              {scoreLabels[rec.score]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
