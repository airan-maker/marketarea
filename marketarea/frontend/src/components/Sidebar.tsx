"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { data: session } = useSession();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-1/2 max-w-[280px] flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--bg-sheet)",
          borderRight: "1px solid var(--border-color)",
        }}
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <span
            className="text-lg font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            MarketArea
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg active:opacity-70"
            aria-label="메뉴 닫기"
          >
            <span className="material-icons" style={{ color: "var(--text-muted)" }}>
              close
            </span>
          </button>
        </div>

        {/* User Info */}
        {session && (
          <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {session.user?.name}
            </p>
            <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
              {session.user?.email}
            </p>
          </div>
        )}

        {/* Menu Items */}
        <nav className="flex-1 py-2">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="material-icons text-xl">home</span>
            홈
          </Link>

          {session && (
            <Link
              href="/saved"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="material-icons text-xl">bookmark</span>
              저장된 분석
            </Link>
          )}
        </nav>

        {/* Bottom Action */}
        <div className="border-t px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
          {session ? (
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="flex items-center gap-3 text-sm w-full transition-colors hover:opacity-80"
              style={{ color: "var(--text-muted)" }}
            >
              <span className="material-icons text-xl">logout</span>
              로그아웃
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                signIn("google");
              }}
              className="flex items-center gap-3 text-sm w-full transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              <span className="material-icons text-xl">login</span>
              로그인
            </button>
          )}
        </div>
      </div>
    </>
  );
}
