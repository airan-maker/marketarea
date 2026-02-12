"use client";

interface DemographicsChartProps {
  femalePercent: number;
  malePercent: number;
  coreAgeGroups: string[];
}

export default function DemographicsChart({
  femalePercent,
  malePercent,
  coreAgeGroups,
}: DemographicsChartProps) {
  const primary = femalePercent >= malePercent ? "여성" : "남성";
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const femaleArc = (femalePercent / 100) * circumference;
  const maleArc = (malePercent / 100) * circumference;
  const femaleRotation = -90;
  const maleRotation = -90 + (femalePercent / 100) * 360;

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>방문자 인구통계</h3>
      <div className="flex items-center gap-5">
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="transparent" stroke="var(--bar-inactive)" strokeWidth="10" />
            <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#137fec" strokeWidth="10" strokeDasharray={`${femaleArc} ${circumference}`} strokeLinecap="round" transform={`rotate(${femaleRotation} 60 60)`} />
            <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#60a5fa" strokeWidth="10" strokeDasharray={`${maleArc} ${circumference}`} strokeLinecap="round" strokeOpacity="0.5" transform={`rotate(${maleRotation} 60 60)`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>주요</span>
            <span className="text-sm font-bold text-primary">{primary}</span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span style={{ color: "var(--text-secondary)" }}>여성</span>
            </div>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{femalePercent}%</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400/50" />
              <span style={{ color: "var(--text-secondary)" }}>남성</span>
            </div>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>{malePercent}%</span>
          </div>
          <div className="pt-2 border-t border-dashed" style={{ borderColor: "var(--border-color)" }}>
            <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>핵심 연령대</div>
            <div className="flex items-center gap-2">
              {coreAgeGroups.map((age) => (
                <span key={age} className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-semibold">{age}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
