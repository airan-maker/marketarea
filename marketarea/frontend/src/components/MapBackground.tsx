"use client";

interface MapBackgroundProps {
  gridLabel?: string;
  showHighlight?: boolean;
}

export default function MapBackground({
  gridLabel = "A-12",
  showHighlight = true,
}: MapBackgroundProps) {
  return (
    <div className="absolute inset-0 z-0 map-bg overflow-hidden">
      {/* Abstract street lines */}
      <div className="absolute top-[30%] left-[20%] w-[60%] h-[2px] rotate-12" style={{ backgroundColor: "var(--map-line)" }} />
      <div className="absolute top-[40%] left-[10%] w-[80%] h-[4px] -rotate-3" style={{ backgroundColor: "var(--map-line)" }} />
      <div className="absolute top-[20%] left-[60%] w-[2px] h-[50%]" style={{ backgroundColor: "var(--map-line)" }} />
      <div className="absolute top-[10%] right-[30%] w-[2px] h-[60%] rotate-12" style={{ backgroundColor: "var(--map-line)" }} />
      <div className="absolute top-[55%] left-[30%] w-[40%] h-[1px] rotate-6" style={{ backgroundColor: "var(--map-line)" }} />
      <div className="absolute top-[15%] left-[40%] w-[1px] h-[40%] -rotate-6" style={{ backgroundColor: "var(--map-line)" }} />

      {/* Heatmap blobs */}
      <div className="absolute top-[35%] left-[45%] w-64 h-64 heatmap-spot rounded-full blur-2xl opacity-60" />
      <div className="absolute top-[20%] right-[20%] w-48 h-48 heatmap-spot rounded-full blur-2xl opacity-40" />
      <div className="absolute bottom-[30%] left-[20%] w-36 h-36 heatmap-spot rounded-full blur-2xl opacity-30" />

      {/* Selected grid cell */}
      {showHighlight && (
        <>
          <div className="absolute top-[42%] left-[48%] w-24 h-24 grid-highlight z-10 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 rotate-3">
            <div className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
              {gridLabel}
            </div>
          </div>

          {/* Surrounding grid lines */}
          <div className="absolute top-[42%] left-[48%] w-24 h-24 border transform translate-x-24 -translate-y-4 rotate-3" style={{ borderColor: "var(--map-grid-border)" }} />
          <div className="absolute top-[42%] left-[48%] w-24 h-24 border transform -translate-x-24 translate-y-4 rotate-3" style={{ borderColor: "var(--map-grid-border)" }} />
          <div className="absolute top-[42%] left-[48%] w-24 h-24 border transform translate-x-2 translate-y-24 rotate-3" style={{ borderColor: "var(--map-grid-border)" }} />
          <div className="absolute top-[42%] left-[48%] w-24 h-24 border transform -translate-x-2 -translate-y-24 rotate-3" style={{ borderColor: "var(--map-grid-border)" }} />

          {/* Map marker label */}
          <div className="absolute top-[34%] left-[48%] transform -translate-x-1/2 z-20 flex flex-col items-center">
            <div
              className="text-xs px-3 py-1.5 rounded-lg shadow-lg border flex items-center gap-1 mb-1"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500" />
              수요 높은 지역
            </div>
            <div className="w-0.5 h-6" style={{ backgroundColor: "var(--text-muted)" }} />
            <div className="w-2 h-2 bg-white rounded-full border-2 border-primary" />
          </div>
        </>
      )}
    </div>
  );
}
