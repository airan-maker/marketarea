"use client";

interface RevenueChartProps {
  currentRevenue: number;
  growthPercent: number;
  dataPoints?: number[];
  months?: string[];
}

export default function RevenueChart({
  currentRevenue,
  growthPercent,
  dataPoints = [0.3, 0.35, 0.5, 0.55, 0.7, 0.85],
  months = ["5월", "6월", "7월", "8월", "9월", "10월"],
}: RevenueChartProps) {
  const width = 320;
  const height = 140;
  const px = 10;
  const py = 10;
  const cw = width - px * 2;
  const ch = height - py * 2;

  const points = dataPoints.map((val, i) => ({
    x: px + (i / (dataPoints.length - 1)) * cw,
    y: py + ch - val * ch,
  }));

  const linePath = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
    })
    .join(" ");

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L ${last.x} ${height} L ${first.x} ${height} Z`;

  function fmt(val: number): string {
    if (val >= 10000) return `${(val / 10000).toFixed(1)}억`;
    return `${Math.round(val).toLocaleString()}만`;
  }

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>월 매출 추이</h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>최근 6개월</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-primary">₩{fmt(currentRevenue)}</div>
          <div className={`text-xs font-medium flex items-center justify-end ${growthPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
            <span className="material-icons text-[10px]">{growthPercent >= 0 ? "arrow_upward" : "arrow_downward"}</span>
            {Math.abs(growthPercent)}%
          </div>
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((r) => (
            <line key={r} x1={px} y1={py + ch * (1 - r)} x2={width - px} y2={py + ch * (1 - r)} stroke="var(--bar-inactive)" strokeDasharray="4 4" />
          ))}
          <path d={areaPath} fill="url(#areaGrad)" />
          <path d={linePath} fill="none" stroke="#137fec" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 3} fill={i === points.length - 1 ? "#137fec" : "var(--chart-dot-fill)"} stroke={i === points.length - 1 ? "var(--text-primary)" : "#137fec"} strokeWidth="2" />
          ))}
        </svg>
      </div>

      <div className="flex justify-between mt-2 text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
        {months.map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}
