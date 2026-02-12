"use client";

import { useState } from "react";

interface SaveAnalysisModalProps {
  address: string;
  industryName: string;
  onSave: (memo: string) => void;
  onClose: () => void;
  saving: boolean;
}

export default function SaveAnalysisModal({
  address,
  industryName,
  onSave,
  onClose,
  saving,
}: SaveAnalysisModalProps) {
  const [memo, setMemo] = useState("");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl border p-5 shadow-2xl"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
        }}
      >
        <h2
          className="text-lg font-bold mb-1"
          style={{ color: "var(--text-primary)" }}
        >
          분석 결과 저장
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          {address} - {industryName}
        </p>

        <label
          className="text-xs font-medium mb-1.5 block"
          style={{ color: "var(--text-secondary)" }}
        >
          메모 (선택)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, 1000))}
          placeholder="이 분석에 대한 메모를 남겨보세요..."
          rows={3}
          className="w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border-color)",
            color: "var(--text-primary)",
          }}
        />
        <p
          className="text-xs mt-1 text-right"
          style={{ color: "var(--text-muted)" }}
        >
          {memo.length}/1000
        </p>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-11 rounded-xl border text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--bg-card-alt)",
              borderColor: "var(--border-color)",
              color: "var(--text-secondary)",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onSave(memo)}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <span className="material-icons text-base">bookmark</span>
                저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
