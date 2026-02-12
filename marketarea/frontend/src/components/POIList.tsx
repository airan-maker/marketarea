"use client";

interface POI {
  name: string;
  category: string;
  detail: string;
  rank: number;
  iconColor: string;
  icon: string;
}

interface POIListProps {
  pois?: POI[];
}

const DEFAULT_POIS: POI[] = [
  { name: "스타벅스 강남R점", category: "카페", detail: "유동인구 매우 높음", rank: 1, iconColor: "text-orange-500 bg-orange-500/10", icon: "coffee" },
  { name: "롯데백화점 강남점", category: "소매", detail: "높은 소비력", rank: 2, iconColor: "text-purple-500 bg-purple-500/10", icon: "shopping_bag" },
  { name: "CGV 강남", category: "엔터", detail: "주말 집중", rank: 3, iconColor: "text-pink-500 bg-pink-500/10", icon: "movie" },
];

export default function POIList({ pois = DEFAULT_POIS }: POIListProps) {
  return (
    <div className="rounded-xl overflow-hidden border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "var(--border-color)" }}>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>주요 시설(POI)</h3>
        <button className="text-xs text-primary hover:text-primary/80 transition-colors">지도보기</button>
      </div>
      <ul>
        {pois.map((poi, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 p-4 transition-colors cursor-pointer border-b last:border-0`}
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${poi.iconColor}`}>
              <span className="material-icons text-xl">{poi.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{poi.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{poi.category} &middot; {poi.detail}</p>
            </div>
            <div className="text-right">
              <span className="block text-sm font-bold" style={{ color: "var(--text-primary)" }}>#{poi.rank}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export type { POI };
