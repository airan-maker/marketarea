"use client";

import { useEffect, useState } from "react";
import { IndustryItem } from "@/types/analysis";
import { getIndustries } from "@/lib/api";

// 프론트엔드 fallback 업종 목록 (백엔드 연결 불가 시)
const FALLBACK_INDUSTRIES: IndustryItem[] = [
  { code: "Q01", name: "한식음식점", category: "음식" },
  { code: "Q03", name: "패스트푸드점", category: "음식" },
  { code: "Q04", name: "치킨전문점", category: "음식" },
  { code: "Q12", name: "커피전문점", category: "음식" },
  { code: "F01", name: "화장품소매점", category: "소매" },
  { code: "F02", name: "편의점", category: "소매" },
  { code: "F08", name: "미용실", category: "서비스" },
  { code: "F09", name: "학원", category: "교육" },
];

interface IndustrySelectorProps {
  value: string;
  onChange: (code: string) => void;
}

export default function IndustrySelector({ value, onChange }: IndustrySelectorProps) {
  const [industries, setIndustries] = useState<IndustryItem[]>(FALLBACK_INDUSTRIES);

  useEffect(() => {
    getIndustries()
      .then(setIndustries)
      .catch(() => setIndustries(FALLBACK_INDUSTRIES));
  }, []);

  // 카테고리별 그룹
  const grouped = industries.reduce<Record<string, IndustryItem[]>>((acc, ind) => {
    if (!acc[ind.category]) acc[ind.category] = [];
    acc[ind.category].push(ind);
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">업종</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">업종 선택</option>
        {Object.entries(grouped).map(([category, items]) => (
          <optgroup key={category} label={category}>
            {items.map((ind) => (
              <option key={ind.code} value={ind.code}>
                {ind.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
