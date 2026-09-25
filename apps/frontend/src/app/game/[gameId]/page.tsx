"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Navbar } from "@/components/layout/Navbar";
import { GameArena } from "@/components/game/GameArena";

export default function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = use(params);
  const { token, isLoading: authLoading } = useAuth();
  const { isConnected, connectionStatus } = useWebSocket();
  const router = useRouter();

  // Authentication guard
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center font-mono text-xs text-[#94A3B8]">
        CONNECTING TO COMBAT ARENA...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] flex flex-col">
      <Navbar />

      {/* Connection warning banner if WS disconnected during active match */}
      {!isConnected && (
        <div className="bg-[#7F1D1D] border-b border-[#DC2626] px-4 py-2 text-center text-xs font-mono font-bold text-[#FCA5A5] flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
          <span>ARENA CONNECTION LOST ({connectionStatus}). ATTEMPTING RECONNECT...</span>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <GameArena gameId={gameId} />
      </main>
    </div>
  );
}
