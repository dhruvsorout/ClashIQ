"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuth } from "@/hooks/useAuth";
import { UsersIcon } from "../ui/Icons";

export function OnlinePlayersList() {
  const { onlineUsers, isConnected } = useWebSocket();
  const { user } = useAuth();

  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-4 h-4 text-[#3B82F6]" />
          <h4 className="font-display font-bold text-sm text-[#F8FAFC]">
            Live Competitors
          </h4>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 bg-[#1A2234] border border-[#242F45] text-[#93C5FD] rounded">
          {onlineUsers.length} ONLINE
        </span>
      </div>

      {!isConnected ? (
        <div className="text-xs text-[#94A3B8] py-4 text-center">
          Connecting to live arena server...
        </div>
      ) : onlineUsers.length === 0 ? (
        <div className="text-xs text-[#94A3B8] py-4 text-center">
          No other players connected currently.
        </div>
      ) : (
        <ul className="divide-y divide-[#1E293B]/60 max-h-72 overflow-y-auto">
          {onlineUsers.map((player) => {
            const isSelf = player.id === user?.id;
            return (
              <li
                key={player.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className={`font-semibold ${isSelf ? "text-[#3B82F6]" : "text-[#F8FAFC]"}`}>
                    {player.username}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] font-mono uppercase bg-[#1A2234] text-[#94A3B8] px-1 rounded">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-[#10B981]">
                  READY
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
