"use client";

interface GaugeWidgetProps {
  label: string;
  value: string;
  subtitle: string;
  percentage: number;
  color?: string;
  icon?: string;
}

export default function GaugeWidget({
  label,
  value,
  subtitle,
  percentage,
  color = "#137fec",
  icon,
}: GaugeWidgetProps) {
  const radius = 40;
  const circumference = Math.PI * radius;
  const filled = (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="rounded-xl p-4 border" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</h3>
        {icon && (
          <span className="material-icons text-sm" style={{ color: "var(--text-muted)" }}>{icon}</span>
        )}
      </div>
      <div className="relative w-24 h-14 mx-auto overflow-hidden">
        <svg viewBox="0 0 100 55" className="w-full h-full">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--gauge-track)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
        </svg>
      </div>
      <div className="text-center mt-1">
        <span className="text-lg font-bold" style={{ color }}>
          {value}
        </span>
        <span className="text-xs block" style={{ color: "var(--text-muted)" }}>{subtitle}</span>
      </div>
    </div>
  );
}
