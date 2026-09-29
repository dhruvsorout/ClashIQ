"use client";

import Link from "next/link";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  getUserLeagueStatus,
  getLeagueProgress,
  BASE_RATING,
} from "@/lib/leagueConfig";
import type { UserProfile, UserStats } from "@/lib/types";
import { SwordsIcon, TrophyIcon } from "@/components/ui/Icons";

interface RatingOverviewProps {
  user: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  onPlayNow?: () => void;
}

export function RatingOverview({
  user,
  stats,
  isLoading,
  onPlayNow,
}: RatingOverviewProps) {
  const { matchmakingState } = useWebSocket();

  if (isLoading) {
    return (
      <div className="surface-card rounded p-6 sm:p-8 animate-pulse border border-[#2A364C]">
        <div className="h-4 w-40 bg-[#1B2332] rounded mb-4" />
        <div className="h-12 w-64 bg-[#1B2332] rounded mb-6" />
        <div className="h-4 w-full bg-[#1B2332] rounded mb-3" />
        <div className="h-3 w-3/4 bg-[#1B2332] rounded" />
      </div>
    );
  }

  // Determine user rating and match count
  const currentRating = user?.rating ?? stats?.rating ?? BASE_RATING;
  const totalGames = stats?.totalGames ?? 0;

  const { isUnranked, league } = getUserLeagueStatus({
    rating: currentRating,
    totalGames,
  });

  const progress = getLeagueProgress(currentRating, isUnranked);

  // Authenticated state
  if (user) {
    return (
      <section aria-labelledby="user-rating-heading" className="space-y-4">
        <div className="surface-card rounded p-6 sm:p-8 relative overflow-hidden border border-[#2A364C]">
          {/* Subtle top indicator bar matching league accent */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ backgroundColor: league.accentColor }}
          />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#222B3B]">
            {/* Left: Rating and League */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
                  YOUR CURRENT STANDING
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#1B2332] border border-[#2A364C] text-[#CBD5E1] rounded">
                  {user.username}
                </span>
              </div>

              <div className="flex items-baseline gap-4 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span
                    id="user-rating-heading"
                    className="font-mono font-extrabold text-4xl sm:text-5xl text-[#F8FAFC] tracking-tight"
                  >
                    {currentRating}
                  </span>
                  <span className="font-mono text-xs text-[#94A3B8] font-bold">
                    ELO
                  </span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border font-mono text-xs font-bold uppercase tracking-wider ${league.badgeBg} ${league.badgeBorder} ${league.badgeColor}`}
                >
                  <TrophyIcon className="w-3.5 h-3.5" />
                  <span>{league.name}</span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action / Matchmaking state */}
            <div className="flex items-center gap-3">
              {isUnranked ? (
                <button
                  onClick={onPlayNow}
                  disabled={matchmakingState !== "IDLE"}
                  className="btn btn-primary font-mono text-xs py-2.5 px-5 flex items-center gap-2"
                >
                  <SwordsIcon className="w-4 h-4" />
                  <span>
                    {matchmakingState === "IDLE"
                      ? "PLAY FIRST GAME TO GET RANKED"
                      : "FINDING OPPONENT..."}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onPlayNow}
                  disabled={matchmakingState !== "IDLE"}
                  className="btn btn-primary font-mono text-xs py-2 px-4 flex items-center gap-2"
                >
                  <SwordsIcon className="w-4 h-4" />
                  <span>
                    {matchmakingState === "IDLE"
                      ? "PLAY RANKED MATCH"
                      : "IN QUEUE..."}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Unranked State Notice */}
          {isUnranked ? (
            <div className="mt-6 p-4 bg-[#1B2332] border border-[#2E3A4E] rounded">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-[#0B0E14] border border-[#334155] flex items-center justify-center shrink-0 mt-0.5 text-[#F59E0B]">
                  <TrophyIcon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="font-mono text-xs font-bold text-[#F8FAFC]">
                    CALIBRATION MATCH REQUIRED
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    New challengers begin with a baseline rating of{" "}
                    <strong className="text-[#FCD34D] font-mono">1000 ELO</strong>.
                    Complete your first 1v1 match to calibrate your placement and
                    officially enter the league ladder.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Ranked State: League Progress Details */
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                <div className="flex items-center gap-2 text-[#F8FAFC]">
                  <span className="font-bold text-[#F59E0B]">{league.name}</span>
                  <span className="text-[#64748B]">•</span>
                  <span className="text-[#94A3B8]">
                    {league.maxRating !== null
                      ? `${league.minRating} — ${league.maxRating} ELO`
                      : `${league.minRating}+ ELO`}
                  </span>
                </div>

                <div className="text-[#94A3B8]">
                  {progress.isMaxLeague ? (
                    <span className="text-[#F43F5E] font-bold">
                      HIGHEST LEAGUE REACHED • APEX DIVISION
                    </span>
                  ) : progress.nextLeague ? (
                    <span>
                      <strong className="text-[#F8FAFC]">
                        {progress.ratingNeeded}
                      </strong>{" "}
                      rating to {progress.nextLeague.name}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div
                  role="progressbar"
                  aria-valuenow={progress.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress to next league: ${progress.progressPercent}%`}
                  className="w-full h-3 bg-[#0B0E14] rounded-full overflow-hidden border border-[#2A364C]"
                >
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${progress.progressPercent}%`,
                      backgroundColor: league.accentColor,
                    }}
                  />
                </div>

                <div className="flex justify-between items-center text-[11px] font-mono text-[#64748B]">
                  <span>
                    {progress.tierSpan
                      ? `${progress.currentInTier} / ${progress.tierSpan} rating in tier`
                      : `${currentRating} ELO`}
                  </span>
                  <span>{progress.progressPercent}% towards promotion</span>
                </div>
              </div>
            </div>
          )}

          {/* Performance Stats Strip */}
          <div className="mt-6 pt-4 border-t border-[#222B3B] grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div className="p-3 bg-[#0B0E14] border border-[#1F2736] rounded">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">
                Games Played
              </div>
              <div className="text-lg font-bold text-[#F8FAFC]">{totalGames}</div>
            </div>

            <div className="p-3 bg-[#0B0E14] border border-[#1F2736] rounded">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">
                Record (W - L)
              </div>
              <div className="text-lg font-bold text-[#F8FAFC]">
                <span className="text-[#10B981]">{stats?.gamesWon ?? 0}W</span>
                <span className="text-[#64748B]"> - </span>
                <span className="text-[#EF4444]">{stats?.gamesLost ?? 0}L</span>
              </div>
            </div>

            <div className="p-3 bg-[#0B0E14] border border-[#1F2736] rounded">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">
                Win Rate
              </div>
              <div className="text-lg font-bold text-[#F8FAFC]">
                {stats?.winRate ?? 0}%
              </div>
            </div>

            <div className="p-3 bg-[#0B0E14] border border-[#1F2736] rounded">
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider">
                Accuracy
              </div>
              <div className="text-lg font-bold text-[#FCD34D]">
                {stats?.accuracy ?? 0}%
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Unauthenticated Guest State
  return (
    <section aria-labelledby="guest-ladder-heading">
      <div className="surface-card rounded p-6 sm:p-8 border border-[#2A364C]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#222B3B]">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-1">
              COMPETITIVE ARENA
            </div>
            <h2
              id="guest-ladder-heading"
              className="font-mono font-extrabold text-3xl sm:text-4xl text-[#F8FAFC] tracking-tight mb-2"
            >
              1000 <span className="text-sm font-normal text-[#94A3B8]">BASELINE RATING</span>
            </h2>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-[#334155] bg-[#1E293B] font-mono text-xs font-bold text-[#94A3B8] uppercase">
              <span>UNRANKED GUEST</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth"
              className="btn btn-primary font-mono text-xs py-2.5 px-5 flex items-center gap-2"
            >
              <SwordsIcon className="w-4 h-4" />
              <span>ENTER ARENA TO GET RANKED</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 p-4 bg-[#1B2332] border border-[#2E3A4E] rounded">
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            All registered competitors start at{" "}
            <strong className="text-[#FCD34D] font-mono">1000 ELO</strong>. Join
            the ladder, compete in live head-to-head speed calculations, and climb
            from Bronze to Grandmaster.
          </p>
        </div>
      </div>
    </section>
  );
}
