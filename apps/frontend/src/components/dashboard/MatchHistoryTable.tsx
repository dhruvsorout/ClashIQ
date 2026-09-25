"use client";

import Link from "next/link";
import type { GameHistoryItem } from "@/lib/types";
import { ChevronRightIcon, SwordsIcon } from "../ui/Icons";
import { EmptyState } from "../ui/EmptyState";

export function MatchHistoryTable({ history }: { history: GameHistoryItem[] }) {
  if (!history || history.length === 0) {
    return (
      <EmptyState
        icon={<SwordsIcon className="w-6 h-6 text-[#F59E0B]" />}
        title="No Match Records Yet"
        description="You have not participated in any ranked matches yet. Queue for a 1v1 battle to log your first combat record."
      />
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#1B2332] border-b border-[#2A364C] text-[11px] font-mono uppercase text-[#94A3B8] tracking-wider">
              <th className="py-3 px-4">Result</th>
              <th className="py-3 px-4">Opponent</th>
              <th className="py-3 px-4 hidden sm:table-cell">Duration/Limit</th>
              <th className="py-3 px-4 text-right">Date</th>
              <th className="py-3 px-3 text-right">Review</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222B3B] text-xs font-mono">
            {history.map((game) => {
              const isWon = game.result === "WON";
              const isLoss = game.result === "LOSS";
              const opponent = game.opponents[0];
              const opponentName = opponent?.username ?? "Anonymous Player";

              return (
                <tr
                  key={game.gameId}
                  className="hover:bg-[#1B2332]/60 transition-colors group cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] tracking-wider rounded font-mono font-bold ${
                        isWon
                          ? "bg-[#064E3B] text-[#6EE7B7] border border-[#059669]"
                          : isLoss
                          ? "bg-[#7F1D1D] text-[#FCA5A5] border border-[#DC2626]"
                          : "bg-[#1E293B] text-[#94A3B8] border border-[#334155]"
                      }`}
                    >
                      {game.result ?? game.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#F8FAFC] font-sans font-semibold">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/games/${game.gameId}`}
                        className="hover:text-[#F59E0B] transition-colors"
                      >
                        {opponentName}
                      </Link>
                      {opponent?.userId && (
                        <Link
                          href={`/profile/${opponent.userId}`}
                          className="text-[10px] font-mono text-[#64748B] hover:text-[#94A3B8]"
                          title="View opponent profile"
                          onClick={(e) => e.stopPropagation()}
                        >
                          [Profile]
                        </Link>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] hidden sm:table-cell">
                    {game.timeLimit}s cap
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#94A3B8]">
                    {formatDate(game.endedAt || game.startedAt)}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      href={`/games/${game.gameId}`}
                      className="inline-flex items-center text-[#94A3B8] group-hover:text-[#F8FAFC] p-1 rounded hover:bg-[#242F44] transition-colors"
                      title="View complete match detail breakdown"
                    >
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
