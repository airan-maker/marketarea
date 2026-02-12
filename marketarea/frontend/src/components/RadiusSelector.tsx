"use client";

interface RadiusSelectorProps {
  value: number;
  onChange: (radius: number) => void;
}

const RADIUS_OPTIONS = [
  { value: 300, label: "300m" },
  { value: 500, label: "500m" },
  { value: 1000, label: "1km" },
];

export default function RadiusSelector({ value, onChange }: RadiusSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 font-medium">반경</span>
      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        {RADIUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors
              ${
                value === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
