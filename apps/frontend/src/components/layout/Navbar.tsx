"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { LogOutIcon, SwordsIcon, TrophyIcon } from "../ui/Icons";

export function Navbar() {
  const { user, token, logout } = useAuth();
  const { connectionStatus, isConnected } = useWebSocket();

  return (
    <header className="w-full bg-[#121824] border-b border-[#1E293B] z-40 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href={token ? "/dashboard" : "/"} className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm rounded-sm">
            <SwordsIcon className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-[#F8FAFC]">
            Clash<span className="text-[#3B82F6]">IQ</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#1A2234] border border-[#242F45] text-[#94A3B8] rounded">
            1V1 ARENA
          </span>
        </Link>

        {/* User state / Actions */}
        <div className="flex items-center gap-3">
          {token && user ? (
            <>
              {/* WS status indicator */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#0B0F17] border border-[#1E293B] rounded text-[11px] font-mono"
                title={`WebSocket: ${connectionStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isConnected
                      ? "bg-[#10B981]"
                      : connectionStatus === "CONNECTING" || connectionStatus === "RECONNECTING"
                      ? "bg-[#F59E0B] animate-pulse"
                      : "bg-[#EF4444]"
                  }`}
                />
                <span className="text-[#94A3B8] uppercase text-[10px] tracking-wider">
                  {isConnected ? "LIVE" : connectionStatus}
                </span>
              </div>

              {/* Rating Pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1A2234] border border-[#334155] rounded font-mono text-xs font-semibold text-[#FCD34D]">
                <TrophyIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>{user.rating ?? 1000}</span>
                <span className="text-[10px] text-[#94A3B8]">ELO</span>
              </div>

              {/* Username & Dashboard */}
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-[#F8FAFC] hover:text-[#3B82F6] px-2 py-1 transition-colors"
              >
                {user.username}
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1A2234] rounded transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth"
                className="text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link href="/auth" className="btn btn-primary text-xs py-1.5 px-3">
                Enter Arena
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
