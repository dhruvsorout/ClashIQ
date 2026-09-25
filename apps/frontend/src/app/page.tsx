"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import {
  ArrowRightIcon,
  CheckIcon,
  SwordsIcon,
  TargetIcon,
  TrophyIcon,
} from "@/components/ui/Icons";

export default function LandingPage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  // Interactive Equation Sandbox Demo State
  const [demoAnswer, setDemoAnswer] = useState("");
  const [demoFeedback, setDemoFeedback] = useState<"idle" | "correct" | "wrong">("idle");

  useEffect(() => {
    if (!isLoading && token) {
      router.replace("/dashboard");
    }
  }, [token, isLoading, router]);

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoAnswer.trim() === "336") {
      setDemoFeedback("correct");
    } else {
      setDemoFeedback("wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14]">
      <Navbar />

      <main className="flex-1">
        {/* ─── Hero Section ────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#141A25] border border-[#2A364C] text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider rounded mb-6">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              Real-Time 1v1 Competitive Arithmetic
            </div>

            <h1 className="font-display font-bold text-4xl sm:text-6xl text-[#F8FAFC] tracking-tight leading-[1.1] mb-6">
              Test your calculation velocity against live opponents.
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-2xl font-sans">
              ClashIQ is a head-to-head arithmetic speed arena. Ten integer equations.
              Millisecond WebSocket latency. Server-authoritative Elo rating progression.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/auth"
                className="btn btn-primary text-base py-3.5 px-7 justify-center font-mono font-bold tracking-wider"
              >
                <span>Enter The Arena</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                href="/auth"
                className="btn btn-secondary text-base py-3.5 px-6 justify-center font-mono"
              >
                Sign In to Account
              </Link>
            </div>
          </div>

          {/* ─── Live Arena Preview Terminal (Interactive Demo) ─────────── */}
          <div className="mt-14 surface-card border-[#2E3A4E] overflow-hidden">
            <div className="bg-[#1B2332] px-4 py-2.5 border-b border-[#2A364C] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-full inline-block" />
                <span className="w-2.5 h-2.5 bg-[#F59E0B] rounded-full inline-block" />
                <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full inline-block" />
                <span className="ml-2 text-[#F8FAFC] font-bold">MATCH PROTOCOL DEMO</span>
              </div>
              <div className="text-[11px] text-[#FCD34D] font-bold uppercase">
                RANKED ARENA [120S]
              </div>
            </div>

            <div className="p-8 sm:p-12 text-center bg-[#101520]">
              <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-widest mb-4">
                QUESTION 4 OF 10 • TRY THE CALCULATION
              </div>

              <div className="font-mono font-extrabold text-4xl sm:text-6xl text-[#F8FAFC] tracking-tight mb-6 flex items-center justify-center gap-3 sm:gap-6 select-none">
                <span>42</span>
                <span className="text-[#3B82F6]">×</span>
                <span>8</span>
                <span className="text-[#64748B]">=</span>
                <span className="text-[#FCD34D] border-b-2 border-[#FCD34D] px-2 min-w-[3ch]">
                  {demoAnswer || "?"}
                </span>
              </div>

              {/* Interactive Demo Input */}
              <form onSubmit={handleDemoSubmit} className="max-w-xs mx-auto mb-4 flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={demoAnswer}
                  onChange={(e) => {
                    setDemoAnswer(e.target.value);
                    setDemoFeedback("idle");
                  }}
                  placeholder="Type 336..."
                  className="input-solid h-11 text-center font-mono font-bold text-lg"
                />
                <button type="submit" className="btn btn-primary h-11 px-4 font-mono font-bold text-xs">
                  CHECK
                </button>
              </form>

              {demoFeedback === "correct" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#064E3B] border border-[#059669] text-[#6EE7B7] text-xs font-mono font-bold rounded">
                  <CheckIcon className="w-3.5 h-3.5" />
                  <span>CORRECT • 42 × 8 = 336 (+1 POINT)</span>
                </div>
              )}
              {demoFeedback === "wrong" && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#7F1D1D] border border-[#DC2626] text-[#FCA5A5] text-xs font-mono font-bold rounded">
                  <span>INCORRECT • TRY 336</span>
                </div>
              )}
              {demoFeedback === "idle" && (
                <p className="text-[11px] font-mono text-[#64748B]">
                  Type the integer answer above and test your speed.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ─── Core Rules / Mechanics ──────────────────────────────────── */}
        <section className="border-t border-[#222B3B] bg-[#101520] py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="mb-12">
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider block mb-2">
                COMPETITIVE ARCHITECTURE
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC]">
                Engineered for pure speed, zero guesswork.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="surface-card p-6 border-t-2 border-t-[#3B82F6]">
                <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] text-[#3B82F6] flex items-center justify-center rounded mb-4">
                  <SwordsIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Atomic 1v1 Matchmaking
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Join a live pool. Opponents are paired instantaneously via dedicated WebSocket connection.
                  Zero bots, no simulated wait periods.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="surface-card p-6 border-t-2 border-t-[#10B981]">
                <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] text-[#10B981] flex items-center justify-center rounded mb-4">
                  <TargetIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Server-Authoritative Math
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Questions are generated with guaranteed integer answers across addition, subtraction,
                  multiplication, and exact division. The server never exposes correct answers to clients.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="surface-card p-6 border-t-2 border-t-[#F59E0B]">
                <div className="w-10 h-10 bg-[#1B2332] border border-[#2A364C] text-[#F59E0B] flex items-center justify-center rounded mb-4">
                  <TrophyIcon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-[#F8FAFC] mb-2">
                  Standard Elo Progression
                </h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Matches update player ratings atomically upon completion via PostgreSQL transactions.
                  Climb from baseline 1000 ELO to Master and Grandmaster ranks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Match Structure Spec ────────────────────────────────────── */}
        <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="surface-card p-8 border-[#2E3A4E] flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider block mb-2">
                MATCH SPECIFICATION
              </span>
              <h3 className="font-display font-bold text-2xl text-[#F8FAFC] mb-3">
                10 Equations. 120 Seconds. First to Finish Wins.
              </h3>
              <ul className="text-sm text-[#94A3B8] space-y-2 font-mono">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                  <span>Single-player progression (opponents cannot disrupt your question flow)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                  <span>Keyboard-first numerical input (Enter auto-submit with millisecond latency)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
                  <span>Automatic forfeit detection on socket disconnect</span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth"
              className="btn btn-primary text-base py-3.5 px-8 shrink-0 font-mono font-bold"
            >
              Start Playing Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#222B3B] bg-[#0B0E14] py-8 text-center text-xs text-[#64748B] font-mono">
        ClashIQ — Real-Time Competitive Arithmetic Arena
      </footer>
    </div>
  );
}
