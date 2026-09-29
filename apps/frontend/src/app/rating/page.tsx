"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getUserStats } from "@/lib/api";
import type { UserStats } from "@/lib/types";
import { getUserLeagueStatus } from "@/lib/leagueConfig";
import { Navbar } from "@/components/layout/Navbar";
import { MatchmakingPanel } from "@/components/dashboard/MatchmakingPanel";
import { RatingOverview } from "@/components/rating/RatingOverview";
import { LeagueLadder } from "@/components/rating/LeagueLadder";
import { HowRatingWorks } from "@/components/rating/HowRatingWorks";
import { SwordsIcon, UsersIcon, RefreshIcon } from "@/components/ui/Icons";

export default function RatingPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  const {
    matchmakingState,
    startMatchmaking,
    currentQuestion,
  } = useWebSocket();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user statistics if authenticated
  const loadUserStats = useCallback(async () => {
    if (!token) {
      setStats(null);
      return;
    }

    setDataLoading(true);
    setError(null);
    try {
      const res = await getUserStats(token);
      setStats(res.stats);
    } catch {
      setError("Unable to load latest statistics. Displaying cached session data.");
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!token) {
        setStats(null);
      } else {
        loadUserStats();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [token, loadUserStats]);

  // Navigate directly into active game if match starts
  useEffect(() => {
    if (currentQuestion) {
      router.push(`/game/${currentQuestion.gameId}`);
    }
  }, [currentQuestion, router]);

  const handlePlayNow = () => {
    if (!token) {
      router.push("/auth");
      return;
    }
    if (matchmakingState === "IDLE") {
      startMatchmaking();
    }
  };

  const currentRating = user?.rating ?? stats?.rating ?? 1000;
  const totalGames = stats?.totalGames ?? 0;
  const { isUnranked, league } = getUserLeagueStatus({
    rating: currentRating,
    totalGames,
  });

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Matchmaking Queue Banner (if active) */}
        <MatchmakingPanel />

        {/* ─── Section A: Page Header ────────────────────────────────── */}
        <div className="border-b border-[#222B3B] pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#F59E0B] font-bold tracking-widest uppercase mb-1">
                <span>ARENA LADDER</span>
                <span className="text-[#64748B]">•</span>
                <span className="text-[#94A3B8]">COMPETITIVE TIERS</span>
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                RATING & LEAGUES
              </h1>
              <p className="text-sm text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                Understand the ClashIQ competitive ladder, server-authoritative Elo mechanics,
                and track your climb toward Grandmaster.
              </p>
            </div>

            {token && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={loadUserStats}
                  disabled={dataLoading}
                  className="btn btn-secondary text-xs py-1.5 px-3 font-mono flex items-center gap-1.5"
                  title="Refresh rating and league statistics"
                >
                  <RefreshIcon className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin" : ""}`} />
                  <span>REFRESH DATA</span>
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-[#7F1D1D]/30 border border-[#DC2626] rounded text-xs font-mono text-[#FCA5A5] flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={loadUserStats}
                className="underline hover:text-white ml-2"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* ─── Section B & C: Current User Rating & Progress ─────────── */}
        <RatingOverview
          user={user}
          stats={stats}
          isLoading={authLoading || dataLoading}
          onPlayNow={handlePlayNow}
        />

        {/* ─── Section D: League Ladder ──────────────────────────────── */}
        <LeagueLadder
          currentLeagueId={user ? league.id : null}
          isUnranked={user ? isUnranked : true}
        />

        {/* ─── Section E & F: How Rating Works & How to Climb ────────── */}
        <HowRatingWorks />

        {/* ─── Bottom CTA Strip ──────────────────────────────────────── */}
        <section aria-label="Competitive match actions" className="surface-card rounded p-6 sm:p-8 border border-[#2A364C] bg-[#141A25]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="font-mono font-bold text-base text-[#F8FAFC] uppercase">
                Ready to Advance Your Standing?
              </h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Step into live 1v1 speed calculations and challenge other players on the ladder.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {token ? (
                <>
                  <button
                    onClick={handlePlayNow}
                    disabled={matchmakingState !== "IDLE"}
                    className="btn btn-primary font-mono text-xs py-2.5 px-5 flex items-center gap-2"
                  >
                    <SwordsIcon className="w-4 h-4" />
                    <span>
                      {matchmakingState === "IDLE"
                        ? "FIND 1V1 MATCH"
                        : "SEARCHING..."}
                    </span>
                  </button>

                  <Link
                    href="/friends"
                    className="btn btn-secondary font-mono text-xs py-2.5 px-4 flex items-center gap-2"
                  >
                    <UsersIcon className="w-4 h-4 text-[#94A3B8]" />
                    <span>CHALLENGE FRIEND</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/auth"
                  className="btn btn-primary font-mono text-xs py-2.5 px-5 flex items-center gap-2"
                >
                  <SwordsIcon className="w-4 h-4" />
                  <span>SIGN IN TO ENTER ARENA</span>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
