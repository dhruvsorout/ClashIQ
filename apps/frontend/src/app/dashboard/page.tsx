"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getGameHistory, getUserStats } from "@/lib/api";
import type { GameHistoryItem, UserStats } from "@/lib/types";
import { Navbar } from "@/components/layout/Navbar";
import { MatchmakingPanel } from "@/components/dashboard/MatchmakingPanel";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { MatchHistoryTable } from "@/components/dashboard/MatchHistoryTable";
import { OnlinePlayersList } from "@/components/dashboard/OnlinePlayersList";
import { ArrowRightIcon, SwordsIcon, TrophyIcon } from "@/components/ui/Icons";

export default function DashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const {
    isConnected,
    matchmakingState,
    startMatchmaking,
    currentQuestion,
  } = useWebSocket();
  const router = useRouter();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  // Load user data from HTTP backend
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    Promise.all([
      getUserStats(token).catch(() => ({ stats: null })),
      getGameHistory(token).catch(() => ({ history: [] })),
    ])
      .then(([statsRes, historyRes]) => {
        if (!isMounted) return;
        setStats(statsRes.stats);
        setHistory(historyRes.history);
      })
      .finally(() => {
        if (isMounted) setDataLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // If already in an active game, navigate directly to arena
  useEffect(() => {
    if (currentQuestion) {
      router.push(`/game/${currentQuestion.gameId}`);
    }
  }, [currentQuestion, router]);

  const handlePlayNow = () => {
    if (matchmakingState === "IDLE") {
      startMatchmaking();
    }
  };

  if (authLoading || (!user && token)) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        AUTHENTICATING ARENA SESSION...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Matchmaking Queue Banner (if active) */}
        <MatchmakingPanel />

        {/* ─── Hero Primary Action Banner ────────────────────────────── */}
        <section className="surface-card p-6 sm:p-8 mb-8 border-[#242F45] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider">
                  ARENA DIVISION
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <span className="text-xs font-mono text-[#FCD34D] font-bold">
                  {user?.rating ?? 1000} ELO
                </span>
              </div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight mb-2">
                Welcome back, {user?.username}.
              </h1>
              <p className="text-sm text-[#94A3B8] max-w-xl">
                Ready for live competition? Queue up for a 1v1 speed arithmetic duel.
                Matchmaking pairs you with active opponents instantly.
              </p>
            </div>

            {/* Play Now Button */}
            <div className="w-full sm:w-auto shrink-0">
              <button
                onClick={handlePlayNow}
                disabled={matchmakingState !== "IDLE" || !isConnected}
                className="btn btn-primary w-full sm:w-auto h-14 px-8 text-base font-mono font-bold tracking-wider"
              >
                <SwordsIcon className="w-5 h-5" />
                <span>
                  {matchmakingState === "SEARCHING"
                    ? "IN MATCHMAKING QUEUE..."
                    : !isConnected
                    ? "CONNECTING TO ARENA..."
                    : "PLAY NOW [1v1 MATCH]"}
                </span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </section>

        {/* ─── Performance Statistics ──────────────────────────────────── */}
        <StatsGrid stats={stats} />

        {/* ─── Two-Column Section: History & Live Competitors ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Match History (2 Columns on Large Screens) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                Recent Match History
              </h3>
              <span className="text-xs font-mono text-[#94A3B8]">
                {history.length} MATCHES RECORDED
              </span>
            </div>

            {dataLoading ? (
              <div className="surface-card p-8 text-center text-xs font-mono text-[#94A3B8]">
                LOADING MATCH ARCHIVES...
              </div>
            ) : (
              <MatchHistoryTable history={history} />
            )}
          </div>

          {/* Sidebar (1 Column) */}
          <div className="space-y-6">
            {/* Live Competitors */}
            <OnlinePlayersList />

            {/* Rating Progression Info Card */}
            <div className="surface-card p-5 border-[#242F45]">
              <div className="flex items-center gap-2 mb-3">
                <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
                <h4 className="font-display font-bold text-sm text-[#F8FAFC]">
                  Competitive Elo Rules
                </h4>
              </div>
              <ul className="text-xs text-[#94A3B8] space-y-2 font-mono leading-relaxed">
                <li>• Win matches to increase your ELO rating.</li>
                <li>• First competitor to answer all 10 equations wins.</li>
                <li>• Ratings are computed atomically on match completion.</li>
                <li>• Disconnecting counts as an automatic forfeit loss.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
