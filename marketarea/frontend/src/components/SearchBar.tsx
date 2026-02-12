"use client";

import { useState, useCallback } from "react";

interface SearchBarProps {
  onSearch: (lat: number, lng: number, address: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    if (window.kakao?.maps?.services) {
      setLoading(true);
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(query, (result: any[], status: string) => {
        setLoading(false);
        if (status === window.kakao.maps.services.Status.OK && result.length > 0) {
          const { y, x } = result[0];
          onSearch(parseFloat(y), parseFloat(x), result[0].address_name || query);
        } else {
          alert("주소를 찾을 수 없습니다. 다시 입력해주세요.");
        }
      });
    } else {
      // Kakao SDK 없는 경우 — 서울 주요 지점 하드코딩 fallback
      const presets: Record<string, [number, number]> = {
        "강남역": [37.4979, 127.0276],
        "홍대입구": [37.5573, 126.9249],
        "명동": [37.5636, 126.985],
        "잠실": [37.5133, 127.1001],
        "건대입구": [37.5404, 127.0693],
        "이태원": [37.5345, 126.9946],
        "신촌": [37.5551, 126.9368],
        "종로": [37.5700, 126.9822],
        "여의도": [37.5219, 126.9245],
        "서울역": [37.5547, 126.9707],
      };

      for (const [name, coords] of Object.entries(presets)) {
        if (query.includes(name)) {
          onSearch(coords[0], coords[1], name);
          return;
        }
      }

      alert("카카오맵 API가 없어 일부 주소만 검색 가능합니다.\n(강남역, 홍대입구, 명동, 잠실, 건대입구, 이태원, 신촌, 종로, 여의도, 서울역)");
    }
  }, [query, onSearch]);

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="주소 또는 장소 검색 (예: 강남역, 서울 강남구 강남대로 390)"
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
                   hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? "검색중..." : "검색"}
      </button>
    </div>
  );
}
