"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/LoadingSkeleton";
import { getGameDetail } from "@/lib/api";
import type { GameDetail } from "@/lib/types";
import {
  ArrowLeftIcon,
  CheckIcon,
  CrossIcon,
  SwordsIcon,
} from "@/components/ui/Icons";

const SIGN_SYMBOLS: Record<string, string> = {
  PLUS: "+",
  MINUS: "−",
  MULTIPLICATION: "×",
  DIVIDE: "÷",
};

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const { user: currentUser, token, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [game, setGame] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  useEffect(() => {
    if (!token || !gameId) return;

    let isMounted = true;

    getGameDetail(token, gameId)
      .then((res) => {
        if (isMounted) setGame(res.game);
      })
      .catch((err) => {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve game archives for this match ID."
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, gameId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        AUTHENTICATING...
      </div>
    );
  }

  const myMember = game?.gameMember.find((m) => m.user.id === currentUser?.id);
  const opponentMember = game?.gameMember.find((m) => m.user.id !== currentUser?.id);

  const isWon = myMember?.status === "WON";
  const isLoss = myMember?.status === "LOSS";

  const formatDuration = (startStr: string, endStr: string) => {
    try {
      const s = new Date(startStr).getTime();
      const e = new Date(endStr).getTime();
      const diffSec = Math.max(0, Math.round((e - s) / 1000));
      const mins = Math.floor(diffSec / 60);
      const secs = diffSec % 60;
      return `${mins}m ${secs}s`;
    } catch {
      return "N/A";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Return to Match Archives</span>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="surface-card p-8 h-40 animate-pulse bg-[#141A25]" />
            <TableSkeleton rows={8} cols={5} />
          </div>
        ) : error || !game ? (
          <EmptyState
            icon={<SwordsIcon className="w-6 h-6 text-[#EF4444]" />}
            title="Match Record Not Found"
            description={error ?? "Match details could not be retrieved. You may not have participated in this game."}
            action={
              <Link href="/dashboard" className="btn btn-secondary font-mono text-xs">
                Back to Dashboard
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {/* Match Overview Header */}
            <div
              className="surface-card p-6 sm:p-8 border-l-4 relative overflow-hidden"
              style={{ borderLeftColor: isWon ? "#10B981" : isLoss ? "#EF4444" : "#F59E0B" }}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider rounded border ${
                        isWon
                          ? "bg-[#064E3B] text-[#6EE7B7] border-[#059669]"
                          : isLoss
                          ? "bg-[#7F1D1D] text-[#FCA5A5] border-[#DC2626]"
                          : "bg-[#1B2332] text-[#94A3B8] border-[#2A364C]"
                      }`}
                    >
                      {isWon ? "MATCH VICTORY" : isLoss ? "MATCH DEFEAT" : "MATCH COMPLETE"}
                    </span>
                    <span className="text-xs font-mono text-[#64748B]">
                      STATUS: {game.status}
                    </span>
                  </div>

                  <h1 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC] tracking-tight">
                    {currentUser?.username} vs {opponentMember?.user.username ?? "Opponent"}
                  </h1>

                  <p className="text-xs text-[#94A3B8] font-mono mt-1">
                    Played on {formatDate(String(game.startedAt))}
                  </p>
                </div>

                {/* Match Metadata Badges */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-2 bg-[#1B2332] border border-[#2A364C] rounded">
                    <div className="text-[10px] text-[#64748B] uppercase">Duration</div>
                    <div className="text-[#F8FAFC] font-bold">
                      {formatDuration(String(game.startedAt), String(game.endedAt))}
                    </div>
                  </div>

                  <div className="px-3 py-2 bg-[#1B2332] border border-[#2A364C] rounded">
                    <div className="text-[10px] text-[#64748B] uppercase">Time Limit</div>
                    <div className="text-[#F8FAFC] font-bold">{game.timeLimit}s cap</div>
                  </div>

                  <div className="px-3 py-2 bg-[#1B2332] border border-[#2A364C] rounded">
                    <div className="text-[10px] text-[#64748B] uppercase">Equations</div>
                    <div className="text-[#F8FAFC] font-bold">{game.questions.length} total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitors Head-to-Head Card */}
            <div className="surface-card p-6 border-[#2A364C]">
              <h3 className="font-display font-bold text-sm text-[#F8FAFC] mb-4 uppercase tracking-wider font-mono">
                Competitors Breakdown
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* You */}
                <div className="surface-elevated p-4 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1B2332] border border-[#3B4B68] rounded flex items-center justify-center font-mono font-bold text-sm text-[#FCD34D]">
                      {currentUser?.username?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC]">
                        {currentUser?.username} (You)
                      </div>
                      <div className="text-xs text-[#94A3B8] font-mono">
                        {game.answers.filter((a) => a.userId === currentUser?.id).length} answers logged
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      isWon
                        ? "bg-[#064E3B] text-[#6EE7B7]"
                        : "bg-[#7F1D1D] text-[#FCA5A5]"
                    }`}
                  >
                    {myMember?.status ?? "PARTICIPANT"}
                  </span>
                </div>

                {/* Opponent */}
                <div className="surface-elevated p-4 rounded flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#1B2332] border border-[#3B4B68] rounded flex items-center justify-center font-mono font-bold text-sm text-[#93C5FD]">
                      {opponentMember?.user.username?.slice(0, 2).toUpperCase() ?? "OP"}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#F8FAFC]">
                        <Link
                          href={`/profile/${opponentMember?.user.id}`}
                          className="hover:text-[#F59E0B] transition-colors"
                        >
                          {opponentMember?.user.username ?? "Opponent"}
                        </Link>
                      </div>
                      <div className="text-xs text-[#94A3B8] font-mono">
                        {game.answers.filter((a) => a.userId === opponentMember?.user.id).length} answers logged
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      opponentMember?.status === "WON"
                        ? "bg-[#064E3B] text-[#6EE7B7]"
                        : "bg-[#7F1D1D] text-[#FCA5A5]"
                    }`}
                  >
                    {opponentMember?.status ?? "PARTICIPANT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions Detailed Breakdown */}
            <div className="surface-card overflow-hidden border-[#2A364C]">
              <div className="p-4 sm:p-5 border-b border-[#2A364C] bg-[#1B2332] flex items-center justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-[#F8FAFC]">
                    Mathematical Equation Audit
                  </h3>
                  <p className="text-xs text-[#94A3B8] font-mono">
                    Server-validated answer audit for all equations in this match.
                  </p>
                </div>
                <span className="text-xs font-mono text-[#FCD34D] font-bold">
                  {game.questions.length} EQUATIONS
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#141A25] border-b border-[#222B3B] text-[11px] font-mono uppercase text-[#94A3B8] tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Equation</th>
                      <th className="py-3 px-4">Authoritative Answer</th>
                      <th className="py-3 px-4">Your Answer</th>
                      <th className="py-3 px-4">Opponent Answer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222B3B] text-xs font-mono">
                    {game.questions.map((q, idx) => {
                      const myAns = game.answers.find(
                        (a) => a.questionId === q.id && a.userId === currentUser?.id
                      );
                      const oppAns = opponentMember
                        ? game.answers.find(
                            (a) => a.questionId === q.id && a.userId === opponentMember.user.id
                          )
                        : null;

                      const myCorrect = myAns && myAns.answer === q.systemAnswer;
                      const oppCorrect = oppAns && oppAns.answer === q.systemAnswer;

                      return (
                        <tr key={q.id} className="hover:bg-[#1B2332]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[#64748B]">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4 text-[#F8FAFC] font-bold text-sm">
                            {q.operation1} {SIGN_SYMBOLS[q.sign] ?? "+"} {q.operation2}
                          </td>
                          <td className="py-3 px-4 text-[#FCD34D] font-bold">
                            {q.systemAnswer}
                          </td>
                          <td className="py-3 px-4">
                            {myAns ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                  myCorrect
                                    ? "bg-[#064E3B] text-[#6EE7B7]"
                                    : "bg-[#7F1D1D] text-[#FCA5A5]"
                                }`}
                              >
                                {myCorrect ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : (
                                  <CrossIcon className="w-3 h-3" />
                                )}
                                <span>{myAns.answer}</span>
                              </span>
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {oppAns ? (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold ${
                                  oppCorrect
                                    ? "bg-[#064E3B] text-[#6EE7B7]"
                                    : "bg-[#7F1D1D] text-[#FCA5A5]"
                                }`}
                              >
                                {oppCorrect ? (
                                  <CheckIcon className="w-3 h-3" />
                                ) : (
                                  <CrossIcon className="w-3 h-3" />
                                )}
                                <span>{oppAns.answer}</span>
                              </span>
                            ) : (
                              <span className="text-[#64748B]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
