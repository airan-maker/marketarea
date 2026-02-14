"use client";

import { useState, useCallback } from "react";

const PRESETS: Record<string, [number, number]> = {
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

interface SearchBarProps {
  onSearch: (lat: number, lng: number, address: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const searchPreset = useCallback((): boolean => {
    for (const [name, coords] of Object.entries(PRESETS)) {
      if (query.includes(name)) {
        onSearch(coords[0], coords[1], name);
        return true;
      }
    }
    return false;
  }, [query, onSearch]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;

    if (typeof google !== "undefined" && google.maps) {
      setLoading(true);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: query, region: "kr" }, (results, status) => {
        setLoading(false);
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const loc = results[0].geometry.location;
          const addr = results[0].formatted_address || query;
          onSearch(loc.lat(), loc.lng(), addr);
          return;
        }
        if (!searchPreset()) {
          alert("주소를 찾을 수 없습니다. 다시 입력해주세요.");
        }
      });
    } else {
      if (!searchPreset()) {
        alert("Google Maps API가 없어 일부 주소만 검색 가능합니다.\n(강남역, 홍대입구, 명동, 잠실, 건대입구, 이태원, 신촌, 종로, 여의도, 서울역)");
      }
    }
  }, [query, onSearch, searchPreset]);

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
