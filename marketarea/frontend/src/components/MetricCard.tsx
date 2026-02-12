"use client";

interface MetricCardProps {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  valueColor?: string;
}

export default function MetricCard({
  icon,
  label,
  value,
  subtitle,
  valueColor,
}: MetricCardProps) {
  return (
    <div className="rounded-xl p-3.5 border flex flex-col gap-2" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
          <span className="material-icons text-lg">{icon}</span>
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <div className="text-lg font-bold" style={{ color: valueColor || "var(--text-primary)" }}>{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{subtitle}</div>
    </div>
  );
}
