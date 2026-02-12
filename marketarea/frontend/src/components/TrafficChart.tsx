"use client";

interface TrafficChartProps {
  data?: number[];
  peakLabel?: string;
  timeLabels?: string[];
}

export default function TrafficChart({
  data = [0.2, 0.3, 0.45, 0.6, 0.5, 0.65, 0.9, 0.8, 0.55, 0.35],
  peakLabel = "18:00 - 20:00",
  timeLabels = ["6AM", "12PM", "6PM", "12AM"],
}: TrafficChartProps) {
  const maxVal = Math.max(...data);

  return (
    <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>피크 유동인구</h3>
        <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded font-medium">{peakLabel}</span>
      </div>

      <div className="h-28 flex items-end justify-between gap-1.5 pt-4">
        {data.map((val, i) => {
          const isPeak = val === maxVal;
          const isHigh = val >= 0.6;
          let barStyle: React.CSSProperties = { height: `${val * 100}%`, backgroundColor: "var(--bar-inactive)" };

          if (isPeak) {
            barStyle.backgroundColor = "#137fec";
            barStyle.boxShadow = "0 0 10px rgba(19,127,236,0.3)";
          } else if (isHigh) {
            if (val >= 0.8) barStyle.backgroundColor = "rgba(19,127,236,0.8)";
            else if (val >= 0.7) barStyle.backgroundColor = "rgba(19,127,236,0.6)";
            else barStyle.backgroundColor = "rgba(19,127,236,0.4)";
          }

          return (
            <div
              key={i}
              className="w-full rounded-t-sm transition-all duration-500"
              style={barStyle}
            />
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] font-mono uppercase" style={{ color: "var(--text-muted)" }}>
        {timeLabels.map((t) => <span key={t}>{t}</span>)}
      </div>
    </div>
  );
}
