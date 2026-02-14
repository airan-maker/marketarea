"use client";

import AuthButton from "./AuthButton";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 safe-top"
      style={{
        backgroundColor: "var(--bg-base)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="w-10 h-10 flex items-center justify-center rounded-lg transition-colors active:opacity-70"
        aria-label="메뉴 열기"
      >
        <span className="material-icons text-2xl" style={{ color: "var(--text-primary)" }}>
          menu
        </span>
      </button>

      {/* Service Name */}
      <h1
        className="text-lg font-bold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        MarketArea
      </h1>

      {/* Auth */}
      <AuthButton />
    </header>
  );
}
