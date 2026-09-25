"use client";

import type { UserStats } from "@/lib/types";
import { FlameIcon, TargetIcon, TrophyIcon, UsersIcon } from "../ui/Icons";

export function StatsGrid({ stats }: { stats: UserStats | null }) {
  const rating = stats?.rating ?? 1000;
  const winRate = stats?.winRate ?? 0;
  const accuracy = stats?.accuracy ?? 0;
  const totalGames = stats?.totalGames ?? 0;
  const gamesWon = stats?.gamesWon ?? 0;
  const gamesLost = stats?.gamesLost ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Rating Card */}
      <div className="surface-card p-5 border-l-4 border-l-[#F59E0B]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
            Rating
          </span>
          <TrophyIcon className="w-4 h-4 text-[#F59E0B]" />
        </div>
        <div className="font-mono font-bold text-2xl sm:text-3xl text-[#FCD34D] mb-1">
          {rating}
        </div>
        <div className="text-[11px] text-[#94A3B8] font-mono">
          Global Competitive Elo
        </div>
      </div>

      {/* Win Rate Card */}
      <div className="surface-card p-5 border-l-4 border-l-[#10B981]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
            Win Rate
          </span>
          <FlameIcon className="w-4 h-4 text-[#10B981]" />
        </div>
        <div className="font-mono font-bold text-2xl sm:text-3xl text-[#6EE7B7] mb-1">
          {winRate}%
        </div>
        <div className="text-[11px] text-[#94A3B8] font-mono">
          {gamesWon}W — {gamesLost}L ({totalGames} matches)
        </div>
      </div>

      {/* Accuracy Card */}
      <div className="surface-card p-5 border-l-4 border-l-[#3B82F6]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
            Accuracy
          </span>
          <TargetIcon className="w-4 h-4 text-[#3B82F6]" />
        </div>
        <div className="font-mono font-bold text-2xl sm:text-3xl text-[#93C5FD] mb-1">
          {accuracy}%
        </div>
        <div className="text-[11px] text-[#94A3B8] font-mono">
          {stats?.correctAnswers ?? 0} of {stats?.totalAnswers ?? 0} correct
        </div>
      </div>

      {/* Total Battles Card */}
      <div className="surface-card p-5 border-l-4 border-l-[#8B5CF6]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8]">
            Battles
          </span>
          <UsersIcon className="w-4 h-4 text-[#8B5CF6]" />
        </div>
        <div className="font-mono font-bold text-2xl sm:text-3xl text-[#C4B5FD] mb-1">
          {totalGames}
        </div>
        <div className="text-[11px] text-[#94A3B8] font-mono">
          Completed 1v1 Matches
        </div>
      </div>
    </div>
  );
}
