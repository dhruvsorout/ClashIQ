"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import { RatingBadge } from "../ui/RatingBadge";
import { CrossIcon, SwordsIcon } from "../ui/Icons";

export function ChallengeModal() {
  const router = useRouter();
  const {
    activeIncomingChallenge,
    acceptChallenge,
    declineChallenge,
    dismissChallengeModal,
    activeGame,
    currentQuestion,
  } = useWebSocket();

  const [isAccepting, setIsAccepting] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // If match starts, navigate to the arena immediately
  useEffect(() => {
    if (activeGame?.gameId) {
      router.push(`/game/${activeGame.gameId}`);
    } else if (currentQuestion?.gameId) {
      router.push(`/game/${currentQuestion.gameId}`);
    }
  }, [activeGame, currentQuestion, router]);

  // Expiration countdown calculation
  useEffect(() => {
    if (!activeIncomingChallenge) {
      const timer = setTimeout(() => {
        setSecondsRemaining(null);
        setIsAccepting(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const expiresAtMs = new Date(activeIncomingChallenge.expiresAt).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        dismissChallengeModal();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeIncomingChallenge, dismissChallengeModal]);

  if (!activeIncomingChallenge) {
    return null;
  }

  const handleAccept = () => {
    setIsAccepting(true);
    acceptChallenge(activeIncomingChallenge.id);
  };

  const handleDecline = () => {
    declineChallenge(activeIncomingChallenge.id);
  };

  const minutes = secondsRemaining !== null ? Math.floor(secondsRemaining / 60) : 0;
  const seconds = secondsRemaining !== null ? secondsRemaining % 60 : 0;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-none animate-fadeIn"
    >
      <div className="w-full max-w-md bg-[#141A25] border-2 border-[#F59E0B] rounded shadow-2xl p-6 relative">
        {/* Close / Dismiss */}
        <button
          onClick={dismissChallengeModal}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1"
          aria-label="Dismiss challenge notification"
        >
          <CrossIcon className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded bg-[#F59E0B]/20 border border-[#F59E0B] flex items-center justify-center text-[#F59E0B]">
            <SwordsIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold text-[#F59E0B] uppercase tracking-wider">
              INCOMING CHALLENGE
            </div>
            <div className="text-[11px] font-mono text-[#64748B]">
              Expires in {formattedTime}
            </div>
          </div>
        </div>

        {/* Challenger Card */}
        <div className="bg-[#1B2332] border border-[#2E3A4E] rounded p-4 mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display font-bold text-xl text-[#F8FAFC]">
                {activeIncomingChallenge.challenger.username}
              </div>
              <div className="text-xs text-[#94A3B8] mt-0.5">
                has challenged you to a 1v1 ClashIQ speed battle.
              </div>
            </div>
            <RatingBadge rating={activeIncomingChallenge.challenger.rating} size="md" />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 font-mono text-xs">
          <button
            onClick={handleDecline}
            disabled={isAccepting}
            className="btn btn-secondary py-2.5 px-4 font-bold border-[#2E3A4E] hover:border-[#EF4444] hover:text-[#EF4444]"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting || (secondsRemaining !== null && secondsRemaining <= 0)}
            className="btn btn-primary py-2.5 px-4 font-bold flex items-center justify-center gap-2"
          >
            {isAccepting ? (
              <span>ENTERING ARENA...</span>
            ) : (
              <>
                <SwordsIcon className="w-4 h-4" />
                <span>ACCEPT MATCH</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
