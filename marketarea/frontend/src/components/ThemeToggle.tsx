"use client";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 border active:scale-95"
      style={{
        backgroundColor: theme === "dark" ? "var(--bg-card)" : "var(--bg-card)",
        borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
        color: "var(--text-primary)",
      }}
      title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span className="material-icons text-xl">
        {theme === "dark" ? "light_mode" : "dark_mode"}
      </span>
    </button>
  );
}
