"use client";

interface ScoreCardProps {
  title: string;
  value: string;
  subtitle?: string;
  color?: "blue" | "green" | "amber" | "red" | "gray";
}

const colorMap = {
  blue: "bg-blue-50 border-blue-200 text-blue-700",
  green: "bg-green-50 border-green-200 text-green-700",
  amber: "bg-amber-50 border-amber-200 text-amber-700",
  red: "bg-red-50 border-red-200 text-red-700",
  gray: "bg-gray-50 border-gray-200 text-gray-700",
};

export default function ScoreCard({
  title,
  value,
  subtitle,
  color = "gray",
}: ScoreCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-75">{title}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-xs mt-1 opacity-60">{subtitle}</p>}
    </div>
  );
}
