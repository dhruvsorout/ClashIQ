import React from "react";
import { TrophyIcon } from "./Icons";
import { getLeagueFromRating, UNRANKED_TIER } from "@/lib/leagueConfig";

export function getRankTier(rating: number | null, isUnranked = false) {
  if (isUnranked) {
    return {
      name: UNRANKED_TIER.name,
      color: UNRANKED_TIER.badgeColor,
      bg: UNRANKED_TIER.badgeBg,
      border: UNRANKED_TIER.badgeBorder,
    };
  }
  const league = getLeagueFromRating(rating);
  return {
    name: league.name,
    color: league.badgeColor,
    bg: league.badgeBg,
    border: league.badgeBorder,
  };
}

interface RatingBadgeProps {
  rating: number | null;
  showTier?: boolean;
  isUnranked?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RatingBadge({ rating, showTier = false, isUnranked = false, size = "md" }: RatingBadgeProps) {
  const val = rating ?? 1000;
  const tier = getRankTier(val, isUnranked);

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#1B2332] border border-[#2A364C] rounded font-mono text-[11px] font-bold text-[#FCD34D]">
        <TrophyIcon className="w-3 h-3 text-[#F59E0B]" />
        <span>{val}</span>
        <span className="text-[9px] text-[#64748B]">ELO</span>
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className="inline-flex items-center gap-3">
        <div className="px-3.5 py-1.5 bg-[#1B2332] border border-[#3B4B68] rounded font-mono font-bold text-2xl text-[#FCD34D] flex items-center gap-2">
          <TrophyIcon className="w-6 h-6 text-[#F59E0B]" />
          <span>{val}</span>
          <span className="text-xs text-[#94A3B8] font-normal">ELO</span>
        </div>
        {showTier && (
          <span className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${tier.bg} ${tier.border} ${tier.color}`}>
            {tier.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1B2332] border border-[#2A364C] rounded font-mono text-xs font-bold text-[#FCD34D]">
        <TrophyIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
        <span>{val}</span>
        <span className="text-[10px] text-[#94A3B8]">ELO</span>
      </span>
      {showTier && (
        <span className={`text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tier.bg} ${tier.border} ${tier.color}`}>
          {tier.name}
        </span>
      )}
    </div>
  );
}
