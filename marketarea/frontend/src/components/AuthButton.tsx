"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (status === "loading") {
    return (
      <div
        className="w-10 h-10 rounded-full animate-pulse"
        style={{ backgroundColor: "var(--bg-card-alt)" }}
      />
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        className="h-10 px-4 rounded-full border text-sm font-medium flex items-center gap-2 transition-colors active:scale-[0.97]"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-color)",
          color: "var(--text-primary)",
        }}
      >
        <span className="material-icons text-lg">login</span>
        로그인
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full border overflow-hidden transition-colors active:scale-[0.97]"
        style={{ borderColor: "var(--border-color)" }}
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-sm font-bold"
            style={{
              backgroundColor: "var(--bg-card-alt)",
              color: "var(--text-primary)",
            }}
          >
            {session.user?.name?.charAt(0) || "U"}
          </div>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 w-56 rounded-xl border shadow-xl overflow-hidden z-50"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: "var(--border-color)" }}>
            <p
              className="text-sm font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {session.user?.name}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {session.user?.email}
            </p>
          </div>
          <Link
            href="/saved"
            onClick={() => setOpen(false)}
            className="w-full px-3 py-2.5 text-sm flex items-center gap-2 transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            <span className="material-icons text-base">bookmark</span>
            저장된 분석
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full px-3 py-2.5 text-sm flex items-center gap-2 border-t transition-colors hover:opacity-80"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <span className="material-icons text-base">logout</span>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
