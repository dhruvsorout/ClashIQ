"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { SwordsIcon } from "../ui/Icons";

export function MatchmakingPanel() {
  const router = useRouter();
  const {
    matchmakingState,
    cancelMatchmaking,
    activeGame,
  } = useWebSocket();

  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Timer while searching
  useEffect(() => {
    if (matchmakingState !== "SEARCHING") {
      return;
    }

    const interval = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
      setSecondsElapsed(0);
    };
  }, [matchmakingState]);

  // Transition to game arena when matched
  useEffect(() => {
    if (matchmakingState === "MATCHED" && activeGame) {
      const timeout = setTimeout(() => {
        router.push(`/game/${activeGame.gameId}`);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [matchmakingState, activeGame, router]);

  if (matchmakingState === "IDLE") {
    return null;
  }

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="surface-card p-6 border-[#3B82F6] mb-8 relative overflow-hidden">
      {/* Top indicator tag */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full animate-ping" />
          <span className="text-xs font-mono font-bold tracking-wider text-[#93C5FD] uppercase">
            {matchmakingState === "MATCHED" ? "MATCH LOCKED" : "MATCHMAKING QUEUE ACTIVE"}
          </span>
        </div>
        <div className="font-mono text-sm font-bold text-[#F8FAFC]">
          {formatTime(secondsElapsed)}
        </div>
      </div>

      {matchmakingState === "MATCHED" && activeGame ? (
        <div className="text-center py-4">
          <div className="text-xs font-mono text-[#10B981] uppercase tracking-wider mb-2 font-bold">
            Competitor Located
          </div>
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F8FAFC] mb-2 flex items-center justify-center gap-3">
            <span>YOU</span>
            <span className="text-[#64748B] text-base font-normal">VS</span>
            <span className="text-[#F59E0B]">{activeGame.opponent.username}</span>
          </h3>
          <p className="text-xs text-[#94A3B8] font-mono">
            Entering arena in 1 second...
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 bg-[#1B2332] border border-[#2A364C] text-[#3B82F6] flex items-center justify-center rounded">
              <SwordsIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-bold text-base text-[#F8FAFC]">
                Searching for 1v1 Opponent
              </h4>
              <p className="text-xs text-[#94A3B8]">
                Scanning active competitor pool for matching opponent...
              </p>
            </div>
          </div>

          <button
            onClick={cancelMatchmaking}
            className="btn btn-secondary text-xs w-full sm:w-auto font-mono"
          >
            Cancel Matchmaking
          </button>
        </div>
      )}
    </div>
  );
}
