"use client";

import Link from "next/link";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { UsersIcon, UserIcon } from "../ui/Icons";

export function OnlinePlayersList() {
  const { onlineUsers, isConnected } = useWebSocket();
  const { user } = useAuth();

  // Filter out the current user completely so they do NOT appear as an opponent
  const competitors = onlineUsers.filter((player) => player.id !== user?.id);

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#222B3B]">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-[#F59E0B]" />
          <h4 className="font-display font-bold text-sm text-[#F8FAFC]">
            Live Competitors
          </h4>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-[#1B2332] border border-[#2A364C] text-[#FCD34D] rounded font-bold">
          {competitors.length} {competitors.length === 1 ? "PLAYER" : "PLAYERS"}
        </span>
      </div>

      {!isConnected ? (
        <div className="text-xs text-[#94A3B8] py-4 text-center font-mono">
          Connecting to live arena server...
        </div>
      ) : competitors.length === 0 ? (
        <div className="text-xs text-[#94A3B8] py-6 text-center font-mono space-y-1">
          <p>No other competitors in pool.</p>
          <p className="text-[11px] text-[#64748B]">Queue up to initiate an instant match pairing.</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#222B3B]/60 max-h-72 overflow-y-auto">
          {competitors.map((player) => (
            <li
              key={player.id}
              className="py-2.5 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span className="font-semibold text-[#F8FAFC]">
                  {player.username}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/profile/${player.id}`}
                  className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1B2332] rounded transition-colors"
                  title="View competitor profile"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                </Link>
                <span className="text-[10px] font-mono text-[#10B981] font-bold">
                  ACTIVE
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
