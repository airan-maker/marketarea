"use client";

interface HealthScoreCardProps {
  score: number;
  label?: string;
  description?: string;
  percentile?: string;
}

function getGrade(score: number) {
  if (score >= 80) return { text: "EXCELLENT", color: "text-green-400", bgColor: "bg-green-500/10 border-green-500/20" };
  if (score >= 60) return { text: "GOOD", color: "text-blue-400", bgColor: "bg-blue-500/10 border-blue-500/20" };
  if (score >= 40) return { text: "FAIR", color: "text-amber-400", bgColor: "bg-amber-500/10 border-amber-500/20" };
  return { text: "POOR", color: "text-red-400", bgColor: "bg-red-500/10 border-red-500/20" };
}

export default function HealthScoreCard({
  score,
  label = "상권 건강도",
  description,
  percentile,
}: HealthScoreCardProps) {
  const grade = getGrade(score);
  const radius = 45;
  const circumference = Math.PI * radius;
  const filled = (Math.min(score, 100) / 100) * circumference;

  return (
    <div className="rounded-xl p-4 border relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-color)" }}>
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <span className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>{Math.round(score)}</span>
            <span className="text-lg font-medium" style={{ color: "var(--text-muted)" }}>/ 100</span>
          </div>
          {percentile && (
            <p className="text-xs text-primary mt-1 font-medium flex items-center">
              <span className="material-icons text-sm mr-1">trending_up</span>
              {percentile}
            </p>
          )}
          {description && (
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{description}</p>
          )}
        </div>
        <div className="relative w-24 h-14 flex items-end justify-center">
          <svg viewBox="0 0 110 60" className="w-full h-full">
            <path
              d="M 10 55 A 45 45 0 0 1 100 55"
              fill="none"
              stroke="var(--gauge-track)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M 10 55 A 45 45 0 0 1 100 55"
              fill="none"
              stroke="#137fec"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
            />
            <text x="55" y="52" textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="700">
              {Math.round(score)}
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
}

export { getGrade };
