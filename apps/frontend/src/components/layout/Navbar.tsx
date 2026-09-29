"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getFriendRequests } from "@/lib/api";
import { RatingBadge } from "../ui/RatingBadge";
import {
  CrossIcon,
  LogOutIcon,
  MenuIcon,
  SwordsIcon,
  UserIcon,
} from "../ui/Icons";

export function Navbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { connectionStatus, isConnected, incomingChallenges } = useWebSocket();
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Poll or load pending friend requests count when authenticated
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getFriendRequests(token)
      .then((res) => {
        if (isMounted && res.requests) {
          setPendingRequestsCount(res.requests.length);
        }
      })
      .catch(() => {
        // Silently ignore if backend offline
      });

    return () => {
      isMounted = false;
    };
  }, [token, pathname]);

  const totalBadgeCount = pendingRequestsCount + (incomingChallenges?.length || 0);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Rating", href: "/rating" },
    {
      label: "Friends",
      href: "/friends",
      badge: totalBadgeCount > 0 ? totalBadgeCount : undefined,
    },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <header className="w-full bg-[#141A25] border-b border-[#222B3B] z-40 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href={token ? "/dashboard" : "/"}
            className="flex items-center gap-2 group focus-visible:outline-none"
          >
            <div className="w-7 h-7 bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm rounded">
              <SwordsIcon className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-[#F8FAFC]">
              Clash<span className="text-[#F59E0B]">IQ</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#1B2332] border border-[#2A364C] text-[#94A3B8] rounded">
              1V1 SPEED ARENA
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          {token && user && (
            <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-semibold">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "bg-[#1B2332] text-[#F8FAFC] border border-[#2E3A4E]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1B2332]/60"
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge !== undefined && (
                      <span className="px-1.5 py-0.2 bg-[#EF4444] text-white text-[10px] rounded-full font-mono font-bold">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* User state / Actions */}
        <div className="flex items-center gap-3">
          {token && user ? (
            <>
              {/* WS status indicator */}
              <div
                className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-[#0B0E14] border border-[#222B3B] rounded text-[11px] font-mono"
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
                  {isConnected ? "ARENA LIVE" : connectionStatus}
                </span>
              </div>

              {/* Challenge Notification Pill */}
              {incomingChallenges.length > 0 && (
                <Link
                  href="/friends"
                  className="flex items-center gap-1.5 px-2 py-1 bg-[#F59E0B]/20 border border-[#F59E0B] rounded text-[11px] font-mono text-[#FCD34D] hover:bg-[#F59E0B]/30 transition-colors"
                  title={`${incomingChallenges.length} incoming challenge${incomingChallenges.length > 1 ? "s" : ""}`}
                >
                  <SwordsIcon className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
                  <span className="font-bold">
                    {incomingChallenges.length} CHALLENGE{incomingChallenges.length > 1 ? "S" : ""}
                  </span>
                </Link>
              )}

              {/* Rating Badge */}
              <RatingBadge rating={user.rating} size="sm" />

              {/* User Handle & Profile Link */}
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[#F8FAFC] hover:text-[#F59E0B] px-2 py-1 transition-colors"
                title="View your competitive profile"
              >
                <UserIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
                <span>{user.username}</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#1B2332] rounded transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="md:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1B2332] rounded transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <CrossIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/rating"
                className="text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 transition-colors"
              >
                Rating
              </Link>
              <Link
                href="/auth"
                className="text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link href="/auth" className="btn btn-primary text-xs py-1.5 px-3 font-mono font-bold">
                Enter Arena
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && token && (
        <div className="md:hidden bg-[#141A25] border-b border-[#222B3B] px-4 py-3 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#222B3B] text-xs font-mono text-[#94A3B8]">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
              <span>{isConnected ? "LIVE ON ARENA" : connectionStatus}</span>
            </div>
            <RatingBadge rating={user?.rating ?? 1000} size="sm" />
          </div>

          <nav className="space-y-1 font-mono text-xs">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded transition-colors ${
                    isActive
                      ? "bg-[#1B2332] text-[#F8FAFC] border border-[#2E3A4E]"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge !== undefined && (
                    <span className="px-1.5 py-0.2 bg-[#EF4444] text-white text-[10px] rounded-full font-bold">
                      {link.badge} PENDING
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
