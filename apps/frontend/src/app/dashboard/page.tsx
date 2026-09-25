"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { getGameHistory, getUserStats } from "@/lib/api";
import type { GameHistoryItem, UserStats } from "@/lib/types";
import { Navbar } from "@/components/layout/Navbar";
import { MatchmakingPanel } from "@/components/dashboard/MatchmakingPanel";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { MatchHistoryTable } from "@/components/dashboard/MatchHistoryTable";
import { OnlinePlayersList } from "@/components/dashboard/OnlinePlayersList";
import { RatingBadge } from "@/components/ui/RatingBadge";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  ArrowRightIcon,
  SwordsIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/ui/Icons";

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
      getGameHistory(token).catch(() => ({ games: [] })),
    ])
      .then(([statsRes, historyRes]) => {
        if (!isMounted) return;
        setStats(statsRes.stats);
        setHistory(historyRes.games ?? []);
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
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        AUTHENTICATING ARENA SESSION...
      </div>
    );
  }

  const currentRating = user?.rating ?? stats?.rating ?? 1000;

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Matchmaking Queue Banner (if active) */}
        <MatchmakingPanel />

        {/* ─── Hero Primary Action Command Center ─────────────────────── */}
        <section className="surface-card p-6 sm:p-8 mb-8 border-[#2E3A4E] relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider">
                  ARENA COMMAND CENTER
                </span>
                <span className="text-xs text-[#64748B]">•</span>
                <RatingBadge rating={currentRating} showTier size="sm" />
              </div>

              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight mb-2">
                Welcome, {user?.username}.
              </h1>
              <p className="text-sm text-[#94A3B8] max-w-xl font-sans">
                Real-time 1v1 speed arithmetic arena. Instant matchmaking pairs you with live competitors.
                Ten integer equations, Elo rating at stake.
              </p>
            </div>

            {/* Play Now Primary Action Button */}
            <div className="w-full sm:w-auto shrink-0 flex flex-col sm:flex-row gap-3">
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

              <Link
                href="/friends"
                className="btn btn-secondary h-14 px-5 font-mono text-xs"
              >
                <UsersIcon className="w-4 h-4" />
                <span>COMMUNITY</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── Performance Statistics Grid ────────────────────────────── */}
        <StatsGrid stats={stats ? { ...stats, rating: currentRating } : null} />

        {/* ─── Two-Column Section: History & Live Competitors ─────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Match History (2 Columns) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="font-display font-bold text-lg text-[#F8FAFC]">
                  Match Archives
                </h3>
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">
                {history.length} {history.length === 1 ? "RECORD" : "RECORDS"}
              </span>
            </div>

            {dataLoading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : (
              <MatchHistoryTable history={history} />
            )}
          </div>

          {/* Sidebar (1 Column) */}
          <div className="space-y-6">
            {/* Live Competitors */}
            <OnlinePlayersList />

            {/* Elo Protocol Rules */}
            <div className="surface-card p-5 border-[#2A364C]">
              <div className="flex items-center gap-2 mb-3">
                <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
                <h4 className="font-display font-bold text-sm text-[#F8FAFC]">
                  Arena Combat Rules
                </h4>
              </div>
              <ul className="text-xs text-[#94A3B8] space-y-2 font-mono leading-relaxed">
                <li>• Each match features 10 server-generated equations.</li>
                <li>• Server validates arithmetic; answers are never exposed.</li>
                <li>• 120-second timer cap with sudden death completion.</li>
                <li>• Instant Elo recalculation on victory or defeat.</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
