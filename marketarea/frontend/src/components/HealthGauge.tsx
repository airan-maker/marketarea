"use client";

interface HealthGaugeProps {
  score: number; // 0~100
}

function getColor(score: number): string {
  if (score >= 70) return "#22c55e";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#f97316";
  return "#ef4444";
}

function getLabel(score: number): string {
  if (score >= 70) return "양호";
  if (score >= 50) return "보통";
  if (score >= 30) return "주의";
  return "위험";
}

export default function HealthGauge({ score }: HealthGaugeProps) {
  const color = getColor(score);
  const label = getLabel(score);
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees
  const circumference = Math.PI * 80; // radius 80
  const filled = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-28 overflow-hidden">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={color}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
          />
          {/* Score text */}
          <text
            x="100"
            y="85"
            textAnchor="middle"
            className="text-3xl font-bold"
            fill={color}
            fontSize="32"
          >
            {Math.round(score)}
          </text>
          <text
            x="100"
            y="105"
            textAnchor="middle"
            fill="#6b7280"
            fontSize="14"
          >
            {label}
          </text>
        </svg>
      </div>
      <p className="text-sm text-gray-500 mt-1">종합 건강도</p>
    </div>
  );
}
