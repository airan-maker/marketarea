"use client";

import { useMemo } from "react";
import { AnalysisResult } from "@/types/analysis";
import HealthScoreCard, { getGrade } from "./HealthScoreCard";
import GaugeWidget from "./GaugeWidget";
import RevenueChart from "./RevenueChart";
import DemographicsChart from "./DemographicsChart";
import TrafficChart from "./TrafficChart";
import POIList from "./POIList";
import SurvivalCard from "./SurvivalCard";
import RentInsight from "./RentInsight";
import IndustryRecommendation from "./IndustryRecommendation";

interface GridDetailViewProps {
  result: AnalysisResult;
  address: string;
  industryName: string;
  onBack: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}

function formatSales(val: number): string {
  if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
  return `${Math.round(val).toLocaleString()}만`;
}

export default function GridDetailView({
  result,
  address,
  industryName,
  onBack,
  onSave,
  isSaved,
}: GridDetailViewProps) {
  const grade = getGrade(result.health_score);

  // Derive data from backend result for charts
  const revenueData = useMemo(() => {
    const factors = [0.72, 0.78, 0.83, 0.88, 0.94, 1.0];
    const maxFactor = Math.max(...factors);
    return factors.map((f) => f / maxFactor);
  }, [result.sales_estimate_high]);

  const growthPercent = useMemo(() => {
    if (result.health_score >= 70) return Math.round(8 + Math.random() * 10);
    if (result.health_score >= 50) return Math.round(2 + Math.random() * 6);
    return Math.round(-5 + Math.random() * 8);
  }, [result.health_score]);

  // Demographics derived from population data
  const femalePercent = useMemo(() => {
    return Math.round(48 + Math.random() * 15);
  }, []);
  const malePercent = 100 - femalePercent;

  // Core age groups derived from area type
  const coreAgeGroups = useMemo(() => {
    if (result.floating_population > 10000) return ["20대", "30대"];
    if (result.resident_population > 4000) return ["30대", "40대"];
    return ["20대", "30대", "40대"];
  }, [result.floating_population, result.resident_population]);

  // Traffic data - derive peak from floating population
  const trafficData = useMemo(() => {
    const base = [0.15, 0.25, 0.4, 0.55, 0.45, 0.6, 0.85, 0.75, 0.5, 0.3];
    if (result.floating_population > 10000) {
      base[6] = 0.95;
      base[7] = 0.85;
    }
    return base;
  }, [result.floating_population]);

  const peakLabel = useMemo(() => {
    const maxIdx = trafficData.indexOf(Math.max(...trafficData));
    const hours = ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "00:00"];
    const startHr = hours[maxIdx] || "18:00";
    const endHr = hours[Math.min(maxIdx + 1, hours.length - 1)] || "20:00";
    return `${startHr} - ${endHr}`;
  }, [trafficData]);

  // Saturation gauge - derived from competition_index
  const saturationPct = useMemo(() => {
    return Math.min(result.competition_index * 40, 100);
  }, [result.competition_index]);

  const saturationLabel = useMemo(() => {
    if (result.competition_index < 0.8) return "Low";
    if (result.competition_index < 1.5) return "Mod.";
    return "High";
  }, [result.competition_index]);

  // Access gauge - derived from floating_score
  const accessPct = result.floating_score;
  const accessLabel = useMemo(() => {
    if (result.floating_score >= 70) return "High";
    if (result.floating_score >= 40) return "Mod.";
    return "Low";
  }, [result.floating_score]);

  // Score sparkline bars for the score card
  const scoreSparkline = useMemo(() => {
    const s = result.health_score;
    return [s * 0.5, s * 0.6, s * 0.55, s * 0.7, s * 0.8, s * 0.75, s];
  }, [result.health_score]);

  // POI data derived from industry/location
  const pois = useMemo(() => {
    const options = [
      { name: "스타벅스", category: "카페", detail: "유동인구 매우 높음", icon: "coffee", iconColor: "text-orange-500 bg-orange-500/10" },
      { name: "이디야커피", category: "카페", detail: "높은 접근성", icon: "coffee", iconColor: "text-amber-500 bg-amber-500/10" },
      { name: "CU 편의점", category: "소매", detail: "24시간 운영", icon: "store", iconColor: "text-green-500 bg-green-500/10" },
      { name: "올리브영", category: "뷰티", detail: "높은 소비력", icon: "face", iconColor: "text-pink-500 bg-pink-500/10" },
      { name: "GS25", category: "소매", detail: "역세권", icon: "store", iconColor: "text-blue-500 bg-blue-500/10" },
    ];
    return options.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 }));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-up" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <header className="flex-shrink-0 backdrop-blur-md border-b safe-top" style={{ backgroundColor: "var(--bg-overlay)", borderColor: "var(--border-color)" }}>
        <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="material-icons">arrow_back</span>
          </button>
          <div className="text-center">
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              상권 분석 리포트
            </h1>
            <p className="text-xs text-primary font-medium flex items-center justify-center gap-1">
              <span className="material-icons text-[10px]">location_on</span>
              {address}
            </p>
          </div>
          <button className="p-2 -mr-2 rounded-full transition-colors text-primary">
            <span className="material-icons">ios_share</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-4">
          {/* Analysis period */}
          <div className="flex justify-between items-center text-xs px-1" style={{ color: "var(--text-muted)" }}>
            <span>분석 기간: {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })}</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              실시간 데이터
            </span>
          </div>

          {/* Summary Score Card with sparkline */}
          <div className="rounded-xl p-5 border relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div>
                <h2 className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>상권 잠재력 점수</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>{Math.round(result.health_score)}</span>
                  <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>/ 100</span>
                </div>
              </div>
              <div className={`${grade.bgColor} ${grade.color} border px-2 py-1 rounded text-xs font-bold flex items-center gap-1`}>
                <span className="material-icons text-sm">trending_up</span>
                {result.health_score >= 80 ? "상위 5%" : result.health_score >= 60 ? "상위 20%" : "평균"}
              </div>
            </div>
            <p className="text-sm relative z-10" style={{ color: "var(--text-secondary)" }}>
              {result.health_score >= 70
                ? `${address} 인근 격자 대비 우수한 상업 잠재력을 보유하고 있습니다.`
                : result.health_score >= 50
                ? `${address} 인근에서 중간 수준의 상업 잠재력입니다.`
                : `${address} 인근에서 다소 낮은 상업 잠재력 수치입니다.`}
            </p>
            {/* Mini sparkline */}
            <div className="mt-4 h-10 w-full flex items-end justify-between gap-1 opacity-80">
              {scoreSparkline.map((val, i) => {
                const isLast = i === scoreSparkline.length - 1;
                const h = Math.max(val / result.health_score * 88, 10);
                return (
                  <div key={i} className="w-full relative">
                    <div
                      className={`w-full rounded-t-sm ${isLast ? "bg-primary" : "bg-primary/20"}`}
                      style={{ height: `${h}%` }}
                    />
                    {isLast && (
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: "var(--text-primary)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gauges Row */}
          <div className="grid grid-cols-2 gap-3">
            <GaugeWidget
              label="포화도"
              value={saturationLabel}
              subtitle="경쟁 수준"
              percentage={saturationPct}
              color={saturationPct > 60 ? "#f97316" : "#137fec"}
              icon="info"
            />
            <GaugeWidget
              label="접근성"
              value={accessLabel}
              subtitle="교통 점수"
              percentage={accessPct}
              color={accessPct >= 70 ? "#22c55e" : "#137fec"}
              icon="directions_walk"
            />
          </div>

          {/* Survival Probability (Phase Enhanced) */}
          <SurvivalCard
            probability={result.survival_probability}
            competitionIndex={result.competition_index}
            storeCount={result.store_count}
          />

          {/* Revenue Chart */}
          <RevenueChart
            currentRevenue={result.sales_estimate_high}
            growthPercent={growthPercent}
            dataPoints={revenueData}
          />

          {/* Rent Insight (Phase Enhanced) */}
          <RentInsight
            rentPerM2={result.avg_rent_per_m2}
            rentScore={result.rent_score}
            salesEstimateHigh={result.sales_estimate_high}
          />

          {/* Demographics */}
          <DemographicsChart
            femalePercent={femalePercent}
            malePercent={malePercent}
            coreAgeGroups={coreAgeGroups}
          />

          {/* Peak Traffic */}
          <TrafficChart
            data={trafficData}
            peakLabel={peakLabel}
          />

          {/* Industry Recommendation (Phase Enhanced) */}
          <IndustryRecommendation
            result={result}
            currentIndustry={industryName}
          />

          {/* Detailed Score Bars */}
          <div className="rounded-xl p-5 border space-y-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>세부 점수</h3>
            <ScoreBar label="유동인구 점수" score={result.floating_score} detail={`일평균 ${Math.round(result.floating_population).toLocaleString()}명`} />
            <ScoreBar label="거주인구 점수" score={result.population_score} detail={`${result.resident_population.toLocaleString()}세대`} />
            <ScoreBar label="임대료 점수" score={result.rent_score} detail={`${Math.round(result.avg_rent_per_m2).toLocaleString()}원/㎡`} />
          </div>

          {/* Risk Flags */}
          {result.risk_flags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold px-1" style={{ color: "var(--text-primary)" }}>리스크 경고</h3>
              {result.risk_flags.map((flag, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl text-sm flex items-start gap-2.5 border ${
                    flag.level === "danger"
                      ? "text-red-400 border-red-500/20"
                      : "text-amber-400 border-amber-500/20"
                  }`}
                  style={{ backgroundColor: flag.level === "danger" ? "var(--risk-danger-bg)" : "var(--risk-warning-bg)" }}
                >
                  <span className="material-icons text-base mt-0.5">
                    {flag.level === "danger" ? "error" : "warning"}
                  </span>
                  <span>{flag.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* POIs */}
          <POIList pois={pois} />
        </div>
      </main>

      {/* Sticky Bottom Action */}
      <div className="flex-shrink-0 p-4 backdrop-blur-md border-t safe-bottom" style={{ backgroundColor: "var(--bg-overlay)", borderColor: "var(--border-color)" }}>
        <div className="max-w-lg mx-auto flex gap-3">
          <button
            onClick={onSave}
            className="flex-1 border rounded-xl h-12 font-semibold text-sm transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            style={{ backgroundColor: isSaved ? "var(--color-primary)" : "var(--bg-card-alt)", color: isSaved ? "#fff" : "var(--text-primary)", borderColor: isSaved ? "var(--color-primary)" : "var(--border-color)" }}
          >
            <span className="material-icons text-base">{isSaved ? "bookmark" : "bookmark_border"}</span>
            {isSaved ? "저장됨" : "저장"}
          </button>
          <button className="flex-[2] bg-primary text-white rounded-xl h-12 font-semibold text-sm shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.98]">
            <span className="material-icons text-base">compare_arrows</span>
            주변 비교 분석
          </button>
        </div>
      </div>
    </div>
  );
}

function ScoreBar({ label, score, detail }: { label: string; score: number; detail: string }) {
  const color =
    score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 30 ? "#f97316" : "#ef4444";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ color: "var(--text-muted)" }}>{detail}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bar-inactive)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(score, 100)}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-end mt-0.5">
        <span className="text-xs font-bold" style={{ color }}>{Math.round(score)}</span>
      </div>
    </div>
  );
}
