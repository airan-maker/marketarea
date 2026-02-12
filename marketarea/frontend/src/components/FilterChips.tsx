"use client";

import { useEffect, useState } from "react";
import { IndustryItem } from "@/types/analysis";
import { getIndustries } from "@/lib/api";

const RADIUS_OPTIONS = [
  { value: 100, label: "100m" },
  { value: 300, label: "300m" },
  { value: 500, label: "500m" },
];

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

const INDUSTRY_ICONS: Record<string, string> = {
  "Q01": "restaurant",
  "Q03": "fastfood",
  "Q04": "lunch_dining",
  "Q12": "local_cafe",
  "F01": "face",
  "F02": "store",
  "F08": "content_cut",
  "F09": "school",
};

interface FilterChipsProps {
  radius: number;
  industryCode: string;
  onRadiusChange: (r: number) => void;
  onIndustryChange: (code: string) => void;
}

export default function FilterChips({
  radius,
  industryCode,
  onRadiusChange,
  onIndustryChange,
}: FilterChipsProps) {
  const [industries, setIndustries] = useState<IndustryItem[]>(FALLBACK_INDUSTRIES);

  useEffect(() => {
    getIndustries()
      .then(setIndustries)
      .catch(() => setIndustries(FALLBACK_INDUSTRIES));
  }, []);

  return (
    <div className="flex space-x-2.5 overflow-x-auto no-scrollbar pb-2">
      {/* Radius chips */}
      {RADIUS_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onRadiusChange(opt.value)}
          className={`flex-shrink-0 px-4 py-2 text-sm font-semibold rounded-full transition-all border ${
            radius === opt.value
              ? "bg-primary text-white shadow-lg border-primary"
              : ""
          }`}
          style={radius !== opt.value ? { backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-color)" } : undefined}
        >
          {opt.label} 반경
        </button>
      ))}

      {/* Divider */}
      <div className="w-[1px] h-6 self-center mx-1 flex-shrink-0" style={{ backgroundColor: "var(--border-color)" }} />

      {/* Industry chips */}
      {industries.slice(0, 6).map((ind) => (
        <button
          key={ind.code}
          onClick={() => onIndustryChange(ind.code === industryCode ? "" : ind.code)}
          className={`flex-shrink-0 px-3.5 py-2 text-sm font-medium rounded-full flex items-center gap-1 transition-all border ${
            industryCode === ind.code
              ? "bg-primary/20 text-primary border-primary/30"
              : ""
          }`}
          style={industryCode !== ind.code ? { backgroundColor: "var(--bg-card)", color: "var(--text-secondary)", borderColor: "var(--border-color)" } : undefined}
        >
          <span className="material-icons text-sm">
            {INDUSTRY_ICONS[ind.code] || "store"}
          </span>
          {ind.name}
        </button>
      ))}
    </div>
  );
}
