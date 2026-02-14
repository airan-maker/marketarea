"use client";

import { useState, useCallback, useMemo } from "react";
import { useSession, signIn } from "next-auth/react";
import { AnalysisResult, IndustryItem } from "@/types/analysis";
import { runAnalysis } from "@/lib/api";
import { saveAnalysis } from "@/lib/saved-api";
import SearchOverlay from "@/components/SearchOverlay";
import FilterChips from "@/components/FilterChips";
import Map from "@/components/Map";
import BottomSheet from "@/components/BottomSheet";
import GridDetailView from "@/components/GridDetailView";
import ThemeToggle from "@/components/ThemeToggle";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SaveAnalysisModal from "@/components/SaveAnalysisModal";

const FALLBACK_INDUSTRIES: IndustryItem[] = [
  { code: "Q01", name: "한식", category: "음식" },
  { code: "Q03", name: "패스트푸드", category: "음식" },
  { code: "Q04", name: "치킨", category: "음식" },
  { code: "Q12", name: "카페", category: "음식" },
  { code: "F01", name: "화장품", category: "소매" },
  { code: "F02", name: "편의점", category: "소매" },
  { code: "F08", name: "미용실", category: "서비스" },
  { code: "F09", name: "학원", category: "교육" },
];

export default function HomePage() {
  const { data: session } = useSession();
  const [center, setCenter] = useState({ lat: 37.4979, lng: 127.0276 });
  const [radius, setRadius] = useState(300);
  const [industryCode, setIndustryCode] = useState("");
  const [address, setAddress] = useState("강남역");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const industryName = useMemo(() => {
    const found = FALLBACK_INDUSTRIES.find((i) => i.code === industryCode);
    return found ? found.name : "업종 미선택";
  }, [industryCode]);

  const executeAnalysis = useCallback(
    async (lat: number, lng: number, r: number, code: string) => {
      if (!code) return;
      setLoading(true);
      setIsSaved(false);
      setError(null);
      try {
        const res = await runAnalysis({ lat, lng, radius: r, industry_code: code });
        setResult(res);
      } catch (e) {
        console.error("Analysis failed:", e);
        const msg = e instanceof Error ? e.message : "분석 중 오류가 발생했습니다";
        setError(msg);
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (lat: number, lng: number, addr: string) => {
      setCenter({ lat, lng });
      setAddress(addr);
      if (industryCode) {
        executeAnalysis(lat, lng, radius, industryCode);
      }
    },
    [industryCode, radius, executeAnalysis]
  );

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setCenter({ lat, lng });
      setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      if (industryCode) {
        executeAnalysis(lat, lng, radius, industryCode);
      }
    },
    [industryCode, radius, executeAnalysis]
  );

  const handleRadiusChange = useCallback(
    (r: number) => {
      setRadius(r);
      if (industryCode) {
        executeAnalysis(center.lat, center.lng, r, industryCode);
      }
    },
    [center, industryCode, executeAnalysis]
  );

  const handleIndustryChange = useCallback(
    (code: string) => {
      setIndustryCode(code);
      if (code) {
        executeAnalysis(center.lat, center.lng, radius, code);
      }
    },
    [center, radius, executeAnalysis]
  );

  const handleSaveClick = useCallback(() => {
    if (!session) {
      signIn("google");
      return;
    }
    setShowSaveModal(true);
  }, [session]);

  const handleSaveConfirm = useCallback(
    async (memo: string) => {
      if (!result) return;
      setSaving(true);
      try {
        await saveAnalysis({
          address,
          industry_code: industryCode,
          industry_name: industryName,
          lat: center.lat,
          lng: center.lng,
          radius,
          result_json: result as unknown as Record<string, unknown>,
          memo: memo || undefined,
        });
        setIsSaved(true);
        setShowSaveModal(false);
      } catch (e) {
        const err = e as Error;
        if (err.message === "UNAUTHORIZED") {
          signIn("google");
        } else {
          console.error("Save failed:", e);
        }
      } finally {
        setSaving(false);
      }
    },
    [result, address, industryCode, industryName, center, radius]
  );

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ backgroundColor: "var(--bg-base)" }}>
      {/* Header */}
      <Header onMenuClick={() => setSidebarOpen(true)} />

      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Real Kakao Map */}
      <div className="absolute inset-0 z-0">
        <Map center={center} radius={radius} onMapClick={handleMapClick} />
      </div>

      {/* Top Overlay: Search + Filters (below header) */}
      <div
        className="absolute top-14 left-0 right-0 z-20 pt-3 pb-4 px-4"
        style={{ background: "linear-gradient(to bottom, var(--bg-base) 0%, var(--bg-overlay) 60%, transparent 100%)" }}
      >
        <div className="mb-3">
          <SearchOverlay onSearch={handleSearch} address={address} />
        </div>
        <FilterChips
          radius={radius}
          industryCode={industryCode}
          onRadiusChange={handleRadiusChange}
          onIndustryChange={handleIndustryChange}
        />
      </div>

      {/* Floating Map Controls */}
      <div className="absolute right-4 top-[220px] z-10 flex flex-col space-y-3">
        <button
          className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center border active:opacity-80 transition-colors"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <span className="material-icons text-xl">layers</span>
        </button>
        <button
          className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center border active:opacity-80 transition-colors"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
        >
          <span className="material-icons text-xl">my_location</span>
        </button>
        <ThemeToggle />
      </div>

      {/* Bottom Sheet */}
      <BottomSheet
        result={result}
        loading={loading}
        error={error}
        address={address}
        industryName={industryName}
        onViewDetail={() => setShowDetail(true)}
      />

      {/* Detail View (Full Screen Overlay) */}
      {showDetail && result && (
        <GridDetailView
          result={result}
          address={address}
          industryName={industryName}
          onBack={() => setShowDetail(false)}
          onSave={handleSaveClick}
          isSaved={isSaved}
        />
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <SaveAnalysisModal
          address={address}
          industryName={industryName}
          onSave={handleSaveConfirm}
          onClose={() => setShowSaveModal(false)}
          saving={saving}
        />
      )}

      {/* Navigation Indicator (mobile home bar) */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-32 h-1 rounded-full z-40 pointer-events-none" style={{ backgroundColor: "var(--text-muted)", opacity: 0.3 }} />
    </div>
  );
}
