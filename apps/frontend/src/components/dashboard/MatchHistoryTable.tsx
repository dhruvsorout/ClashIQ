"use client";

import type { GameHistoryItem } from "@/lib/types";
import { SwordsIcon } from "../ui/Icons";

export function MatchHistoryTable({ history }: { history: GameHistoryItem[] }) {
  if (!history || history.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <div className="w-10 h-10 mx-auto mb-3 bg-[#1A2234] border border-[#242F45] text-[#94A3B8] flex items-center justify-center rounded">
          <SwordsIcon className="w-5 h-5" />
        </div>
        <h4 className="font-display font-bold text-base text-[#F8FAFC] mb-1">
          No Match Records
        </h4>
        <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
          You haven&apos;t played any ranked matches yet. Queue for a 1v1 match to establish your rating.
        </p>
      </div>
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
            <tr className="bg-[#1A2234] border-b border-[#242F45] text-[11px] font-mono uppercase text-[#94A3B8] tracking-wider">
              <th className="py-3 px-4">Result</th>
              <th className="py-3 px-4">Opponent</th>
              <th className="py-3 px-4 hidden sm:table-cell">Time Limit</th>
              <th className="py-3 px-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B] text-xs font-mono">
            {history.map((game) => {
              const isWon = game.result === "WON";
              const opponent = game.opponents[0];
              const opponentName = opponent?.username ?? "Unknown Player";

              return (
                <tr
                  key={game.gameId}
                  className="hover:bg-[#1A2234]/50 transition-colors"
                >
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] tracking-wider rounded-xs ${
                        isWon
                          ? "bg-[#064E3B] text-[#6EE7B7] border border-[#059669]"
                          : "bg-[#7F1D1D] text-[#FCA5A5] border border-[#DC2626]"
                      }`}
                    >
                      {game.result ?? "N/A"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#F8FAFC] font-sans font-semibold">
                    {opponentName}
                  </td>
                  <td className="py-3.5 px-4 text-[#94A3B8] hidden sm:table-cell">
                    {game.timeLimit}s
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#94A3B8]">
                    {formatDate(game.endedAt || game.startedAt)}
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
