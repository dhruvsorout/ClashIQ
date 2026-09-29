"use client";

import {
  ActivityIcon,
  ShieldIcon,
  SwordsIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/ui/Icons";

export function HowRatingWorks() {
  return (
    <div className="space-y-8">
      {/* ─── Section E: How Rating Works ─────────────────────────────── */}
      <section aria-labelledby="how-rating-works-heading" className="space-y-4">
        <div>
          <h2
            id="how-rating-works-heading"
            className="font-mono font-bold text-lg text-[#F8FAFC] tracking-tight uppercase"
          >
            HOW RATING WORKS
          </h2>
          <p className="text-xs text-[#94A3B8]">
            ClashIQ uses an authoritative Elo calculation engine calibrated for 1v1 speed mathematics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 1000 Baseline & Expected Score */}
          <div className="surface-card rounded p-5 border border-[#222B3B] space-y-3">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <TrophyIcon className="w-4 h-4" />
              <h3 className="font-mono font-bold text-xs uppercase text-[#F8FAFC]">
                1000 Baseline & Probability
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Every newly registered contender starts at{" "}
              <strong className="text-[#F8FAFC] font-mono">1000 ELO</strong>. Before
              each 1v1 match, the server calculates the win probability between
              both players using standard Elo distribution curves.
            </p>
          </div>

          {/* Card 2: K-Factor & Dynamic Deltas */}
          <div className="surface-card rounded p-5 border border-[#222B3B] space-y-3">
            <div className="flex items-center gap-2 text-[#3B82F6]">
              <ActivityIcon className="w-4 h-4" />
              <h3 className="font-mono font-bold text-xs uppercase text-[#F8FAFC]">
                K-Factor 32 & Scaled Gains
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Match rating changes scale with a{" "}
              <strong className="text-[#F8FAFC] font-mono">K-Factor of 32</strong>.
              Defeating a higher-ranked opponent yields massive rating gains (up to
              +32 points), while beating lower-ranked players yields smaller gains.
            </p>
          </div>

          {/* Card 3: Zero-Sum & Minimum Floor */}
          <div className="surface-card rounded p-5 border border-[#222B3B] space-y-3">
            <div className="flex items-center gap-2 text-[#10B981]">
              <ShieldIcon className="w-4 h-4" />
              <h3 className="font-mono font-bold text-xs uppercase text-[#F8FAFC]">
                Zero-Sum & +8 Min Delta
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Rating points earned by the victor match the points deducted from
              the loser. Every victory guarantees a minimum floor of{" "}
              <strong className="text-[#F8FAFC] font-mono">+8 rating</strong>, and
              ratings never drop below 0.
            </p>
          </div>
        </div>

        {/* Technical Callout Box */}
        <div className="p-4 bg-[#141A25] border border-[#222B3B] rounded font-mono text-xs text-[#94A3B8] space-y-1">
          <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
            AUTHORITATIVE SERVER FORMULA
          </div>
          <p className="text-[#CBD5E1]">
            Expected Score: <code className="text-[#FCD34D]">E = 1 / (1 + 10^((Opponent - You) / 400))</code>
          </p>
          <p className="text-[#CBD5E1]">
            Win Delta: <code className="text-[#FCD34D]">Δ = max(8, round(32 × (1 - E)))</code>
          </p>
        </div>
      </section>

      {/* ─── Section F: How to Climb ─────────────────────────────────── */}
      <section aria-labelledby="how-to-climb-heading" className="space-y-4">
        <div>
          <h2
            id="how-to-climb-heading"
            className="font-mono font-bold text-lg text-[#F8FAFC] tracking-tight uppercase"
          >
            HOW TO CLIMB THE LADDER
          </h2>
          <p className="text-xs text-[#94A3B8]">
            Core competitive principles for consistent ladder advancement.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="surface-card rounded p-5 border border-[#222B3B] space-y-2">
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <TargetIcon className="w-4 h-4" />
              <h3 className="font-mono font-bold text-xs text-[#F8FAFC] uppercase">
                Prioritize First-Attempt Accuracy
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Each question tests rapid calculation under pressure. Submitting
              incorrect answers concedes precious seconds and points to your opponent.
              Accuracy provides the foundation for winning rounds.
            </p>
          </div>

          <div className="surface-card rounded p-5 border border-[#222B3B] space-y-2">
            <div className="flex items-center gap-2 text-[#3B82F6]">
              <SwordsIcon className="w-4 h-4" />
              <h3 className="font-mono font-bold text-xs text-[#F8FAFC] uppercase">
                Challenge Rival Contenders
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Both ranked queue matchmaking and direct Friend Challenges update
              your rating authoritatively. Challenging stronger players gives you
              the highest potential rating upside per match.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
