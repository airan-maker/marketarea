"use client";

interface SurvivalCardProps {
  probability: number; // 0~1
  competitionIndex: number;
  storeCount: number;
}

export default function SurvivalCard({
  probability,
  competitionIndex,
  storeCount,
}: SurvivalCardProps) {
  const pct = Math.round(probability * 100);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const filled = probability * circumference;

  const color = pct >= 70 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const label = pct >= 70 ? "양호" : pct >= 50 ? "보통" : "주의";

  // 3-year projected stores
  const yr1 = Math.round(storeCount * (1 - (1 - probability) * 0.4));
  const yr2 = Math.round(storeCount * probability);
  const yr3 = Math.round(storeCount * Math.pow(probability, 1.3));

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>생존 확률 분석</h3>
      <div className="flex items-center gap-5">
        {/* Circular gauge */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="transparent" stroke="var(--gauge-track)" strokeWidth="7" />
            <circle
              cx="50" cy="50" r={radius} fill="transparent"
              stroke={color} strokeWidth="7"
              strokeDasharray={`${filled} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold" style={{ color }}>{pct}%</span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
          </div>
        </div>

        {/* Projection table */}
        <div className="flex-1 space-y-2">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>3년 생존 전망</div>
          {[
            { yr: "1년 후", val: yr1 },
            { yr: "2년 후", val: yr2 },
            { yr: "3년 후", val: yr3 },
          ].map((row) => (
            <div key={row.yr} className="flex justify-between items-center text-xs">
              <span style={{ color: "var(--text-muted)" }}>{row.yr}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bar-inactive)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(row.val / storeCount) * 100}%`, backgroundColor: color }} />
                </div>
                <span className="font-bold w-8 text-right" style={{ color: "var(--text-primary)" }}>{row.val}개</span>
              </div>
            </div>
          ))}
          <div className="pt-1.5 border-t border-dashed" style={{ borderColor: "var(--border-color)" }}>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              경쟁지수 {competitionIndex.toFixed(1)}x 기준 · 현재 {storeCount}개 점포
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
