"use client";

import { LEAGUES } from "@/lib/leagueConfig";
import { TrophyIcon, ShieldIcon } from "@/components/ui/Icons";

interface LeagueLadderProps {
  currentLeagueId?: string | null;
  isUnranked?: boolean;
}

export function LeagueLadder({
  currentLeagueId,
  isUnranked = false,
}: LeagueLadderProps) {
  // Present ladder from apex (Grandmaster) down to entry tier (Bronze)
  const ladderLeagues = [...LEAGUES].reverse();

  return (
    <section aria-labelledby="league-ladder-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2
            id="league-ladder-heading"
            className="font-mono font-bold text-lg text-[#F8FAFC] tracking-tight uppercase"
          >
            COMPETITIVE DIVISIONS
          </h2>
          <p className="text-xs text-[#94A3B8]">
            ClashIQ tier thresholds and competitive tier requirements.
          </p>
        </div>

        <div className="text-[11px] font-mono text-[#64748B]">
          7 COMPETITIVE TIERS • CALIBRATED AT 1000 ELO
        </div>
      </div>

      <div className="space-y-2.5">
        {ladderLeagues.map((tier) => {
          const isCurrent = !isUnranked && currentLeagueId === tier.id;

          return (
            <div
              key={tier.id}
              className={`surface-card rounded p-4 sm:p-5 transition-all relative overflow-hidden ${
                isCurrent
                  ? "border-[#F59E0B] bg-[#1B2332] shadow-sm ring-1 ring-[#F59E0B]/30"
                  : "border-[#222B3B] hover:border-[#2E3A4E]"
              }`}
            >
              {/* Left tier color accent indicator */}
              <div
                className="absolute top-0 bottom-0 left-0 w-1 sm:w-1.5"
                style={{ backgroundColor: tier.accentColor }}
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
                {/* Left: Tier Badge, Name & Range */}
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className={`w-9 h-9 rounded flex items-center justify-center shrink-0 border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeColor}`}
                  >
                    <TrophyIcon className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[#F8FAFC]">
                        {tier.name}
                      </span>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${tier.badgeBg} ${tier.badgeBorder} ${tier.badgeColor} uppercase`}
                      >
                        {tier.maxRating !== null
                          ? `${tier.minRating} — ${tier.maxRating} ELO`
                          : `${tier.minRating}+ ELO`}
                      </span>

                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded bg-[#F59E0B] text-[#0B0E14] text-[10px] font-mono font-extrabold uppercase tracking-wider">
                          YOUR LEAGUE
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                      {tier.description}
                    </p>
                  </div>
                </div>

                {/* Right: Ladder Position Rank Indicator */}
                <div className="hidden md:flex items-center gap-2 shrink-0 font-mono text-xs text-[#64748B]">
                  <span className="text-[10px] uppercase tracking-wider">
                    TIER {tier.rankIndex + 1} OF 7
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unranked Division Note */}
      <div className="surface-card rounded p-4 border border-[#222B3B] bg-[#10141D] pl-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#94A3B8] shrink-0">
            <ShieldIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs">
            <span className="font-mono font-bold text-[#F8FAFC] mr-2">
              UNRANKED DIVISION
            </span>
            <span className="text-[#94A3B8]">
              Players with 0 completed games remain unranked until they finish
              their first match, upon which their placement tier will be calculated.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
