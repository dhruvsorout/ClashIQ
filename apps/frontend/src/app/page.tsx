"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowRightIcon, SwordsIcon, TargetIcon, TrophyIcon } from "@/components/ui/Icons";

export default function LandingPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17]">
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero Section ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#121824] border border-[#242F45] text-xs font-mono font-bold text-[#93C5FD] uppercase tracking-wider rounded mb-6">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              Ranked Head-to-Head Speed Math
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-6xl text-[#F8FAFC] tracking-tight leading-[1.1] mb-6">
              Test your calculation velocity against live opponents.
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-2xl font-sans">
              ClashIQ is a real-time 1v1 arena for arithmetic speed and precision.
              Ten integer equations. Millisecond latency. Standard Elo rating progression.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/auth"
                className="btn btn-primary text-base py-3 px-6 justify-center"
              >
                <span>Enter The Arena</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/auth"
                className="btn btn-secondary text-base py-3 px-6 justify-center"
              >
                Sign In to Account
              </Link>
            </div>
          </div>

          {/* ─── Live Arena Preview Terminal ───────────────────────────── */}
          <div className="mt-14 surface-card border-[#242F45] overflow-hidden">
            <div className="bg-[#1A2234] px-4 py-2.5 border-b border-[#242F45] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-full inline-block" />
                <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full inline-block" />
                <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full inline-block" />
                <span className="ml-2 text-[#F8FAFC] font-bold">MATCH DEMO: YOU vs OPPONENT</span>
              </div>
              <div className="text-[11px] text-[#93C5FD] font-bold uppercase">
                RANKED MATCH [120S]
              </div>
            </div>

            <div className="p-8 sm:p-12 text-center bg-[#0F1420]">
              <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-widest mb-4">
                QUESTION 4 OF 10
              </div>
              <div className="font-mono font-extrabold text-4xl sm:text-6xl text-[#F8FAFC] tracking-tight mb-6 flex items-center justify-center gap-3 sm:gap-6">
                <span>36</span>
                <span className="text-[#3B82F6]">×</span>
                <span>8</span>
                <span className="text-[#64748B]">=</span>
                <span className="text-[#FCD34D] border-b-2 border-[#FCD34D] px-2">288</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#064E3B] border border-[#059669] text-[#6EE7B7] text-xs font-mono font-bold rounded">
                <span>CORRECT</span>
                <span>•</span>
                <span>ADVANCING TO QUESTION 5 (+1 POINT)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Core Rules / Mechanics ──────────────────────────────────── */}
        <section className="border-t border-[#1E293B] bg-[#121824] py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mb-2">
                COMPETITIVE RULES
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC]">
                Built for pure speed, zero guesswork.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="surface-card p-6 border-t-2 border-t-[#3B82F6]">
                <div className="w-10 h-10 bg-[#1A2234] border border-[#242F45] text-[#3B82F6] flex items-center justify-center rounded mb-4">
                  <SwordsIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Atomic 1v1 Matchmaking
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Join a live pool. Opponents are paired instantaneously via WebSocket. No bots, no fabricated delays.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="surface-card p-6 border-t-2 border-t-[#10B981]">
                <div className="w-10 h-10 bg-[#1A2234] border border-[#242F45] text-[#10B981] flex items-center justify-center rounded mb-4">
                  <TargetIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Server-Authoritative Math
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Questions are generated with guaranteed integer answers across addition, subtraction, multiplication, and exact division. The client never sees the answers.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="surface-card p-6 border-t-2 border-t-[#F59E0B]">
                <div className="w-10 h-10 bg-[#1A2234] border border-[#242F45] text-[#F59E0B] flex items-center justify-center rounded mb-4">
                  <TrophyIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Standard Elo Progression
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Matches update player ratings atomically upon completion via PostgreSQL transactions. Climb from baseline 1000 ELO to the top tiers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Match Structure Spec ────────────────────────────────────── */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="surface-card p-8 border-[#242F45] flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider block mb-2">
                MATCH SPECIFICATION
              </span>
              <h3 className="font-display font-bold text-2xl text-[#F8FAFC] mb-3">
                10 Equations. 120 Seconds. First to 10 Wins.
              </h3>
              <ul className="text-sm text-[#94A3B8] space-y-1.5 font-mono">
                <li>• Single-player question progression (opponent cannot rush your screen)</li>
                <li>• Keyboard-first numerical input (Enter auto-submit)</li>
                <li>• Forfeit detection on unexpected socket disconnection</li>
              </ul>
            </div>
            <Link
              href="/auth"
              className="btn btn-primary text-base py-3 px-8 shrink-0"
            >
              Start Playing
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#1E293B] bg-[#0B0F17] py-8 text-center text-xs text-[#64748B] font-mono">
        ClashIQ — Real-Time Competitive Mathematics Arena
      </footer>
    </div>
  );
}
