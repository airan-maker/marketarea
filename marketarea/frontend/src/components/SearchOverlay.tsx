"use client";

import { useState, useCallback } from "react";

const PRESETS: Record<string, [number, number]> = {
  "강남역": [37.4979, 127.0276],
  "역삼": [37.5007, 127.0365],
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

interface SearchOverlayProps {
  onSearch: (lat: number, lng: number, address: string) => void;
  address?: string;
}

export default function SearchOverlay({ onSearch, address = "" }: SearchOverlayProps) {
  const [query, setQuery] = useState(address);
  const [loading, setLoading] = useState(false);

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
        // Geocoder 실패 시 preset fallback
        searchPreset();
      });
    } else {
      searchPreset();
    }
  }, [query, onSearch]);

  function searchPreset() {
    for (const [name, coords] of Object.entries(PRESETS)) {
      if (query.includes(name)) {
        onSearch(coords[0], coords[1], name);
        return;
      }
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-icons" style={{ color: "var(--text-muted)" }}>search</span>
      </div>
      <input
        className="block w-full pl-10 pr-12 py-3 border-none rounded-xl leading-5 focus:outline-none focus:ring-2 focus:ring-primary shadow-lg text-sm"
        style={{ backgroundColor: "var(--bg-input)", color: "var(--text-primary)" }}
        placeholder="동네, 역, 주소 검색"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          onClick={handleSearch}
          disabled={loading}
          className="p-1.5 rounded-full transition-colors"
          style={{ backgroundColor: "var(--bg-card-alt)", color: "var(--text-secondary)" }}
        >
          <span className="material-icons text-sm">
            {loading ? "hourglass_empty" : "tune"}
          </span>
        </button>
      </div>
    </div>
  );
}
