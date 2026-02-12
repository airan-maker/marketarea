"use client";

interface RentInsightProps {
  rentPerM2: number;
  rentScore: number;
  salesEstimateHigh: number;
}

export default function RentInsight({
  rentPerM2,
  rentScore,
  salesEstimateHigh,
}: RentInsightProps) {
  // Rent to Revenue ratio (assume 33m2 average store size)
  const monthlyRent = rentPerM2 * 33;
  const monthlyRevenue = salesEstimateHigh * 10000; // 만원 → 원
  const rentRatio = monthlyRevenue > 0 ? (monthlyRent / monthlyRevenue) * 100 : 0;

  const riskLevel = rentRatio > 15 ? "높음" : rentRatio > 10 ? "보통" : "양호";
  const riskColor = rentRatio > 15 ? "#ef4444" : rentRatio > 10 ? "#f59e0b" : "#22c55e";

  const scoreColor = rentScore >= 70 ? "#22c55e" : rentScore >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>임대료 인사이트</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Rent per m2 */}
        <div>
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>m2당 임대료</div>
          <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {Math.round(rentPerM2).toLocaleString()}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>원</span>
          </div>
        </div>
        {/* Rent score */}
        <div>
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>임대료 점수</div>
          <div className="text-lg font-bold" style={{ color: scoreColor }}>
            {Math.round(rentScore)}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>/100</span>
          </div>
        </div>
      </div>

      {/* Rent to Revenue ratio bar */}
      <div className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-card-alt)" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>임대료/매출 비율</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${riskColor}15`, color: riskColor }}>
            {riskLevel}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--gauge-track)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(rentRatio * 4, 100)}%`, backgroundColor: riskColor }}
            />
          </div>
          <span className="text-sm font-bold min-w-[40px] text-right" style={{ color: riskColor }}>
            {rentRatio.toFixed(1)}%
          </span>
        </div>
        <p className="text-[10px] mt-2" style={{ color: "var(--text-muted)" }}>
          {rentRatio > 15
            ? "임대료 부담이 높습니다. 매출 대비 15% 초과 시 수익성 저하 우려가 있습니다."
            : rentRatio > 10
            ? "임대료 부담이 적정 수준입니다. 안정적 수익 가능성이 있습니다."
            : "임대료 부담이 낮아 수익성이 우수한 입지입니다."}
        </p>
      </div>
    </div>
  );
}
