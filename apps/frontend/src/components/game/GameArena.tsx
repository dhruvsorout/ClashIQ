"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ClockIcon, SwordsIcon, TrophyIcon } from "../ui/Icons";

const SIGN_SYMBOLS: Record<string, string> = {
  PLUS: "+",
  MINUS: "−",
  MULTIPLICATION: "×",
  DIVIDE: "÷",
};

interface QuestionInputFormProps {
  onSubmit: (answer: number) => void;
  isWrong: boolean;
  isCorrect: boolean;
}

function QuestionInputForm({
  onSubmit,
  isWrong,
  isCorrect,
}: QuestionInputFormProps) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(val.trim(), 10);
    if (!isNaN(num)) {
      onSubmit(num);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9\-]*"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Your answer"
          autoFocus
          className={`input-solid font-mono font-bold text-center text-2xl h-14 ${
            isCorrect
              ? "border-[#10B981] bg-[#064E3B]/20 text-[#6EE7B7]"
              : isWrong
              ? "border-[#EF4444] bg-[#7F1D1D]/20 text-[#FCA5A5]"
              : ""
          }`}
        />
        <button
          type="submit"
          disabled={!val.trim()}
          className="btn btn-primary h-14 px-6 font-mono font-bold text-base"
        >
          SUBMIT
        </button>
      </div>
      <p className="text-[11px] text-[#64748B] font-mono mt-2">
        Press <kbd className="px-1.5 py-0.5 bg-[#1A2234] border border-[#242F45] rounded text-[#94A3B8]">Enter</kbd> to submit instantly
      </p>
    </form>
  );
}

export function GameArena({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    activeGame,
    currentQuestion,
    lastAnswerResult,
    gameOverResult,
    submitAnswer,
    leaveGame,
    resetGameState,
    startMatchmaking,
  } = useWebSocket();

  const [timeLeft, setTimeLeft] = useState(120);

  // Derived feedback state from context without useEffect setState!
  const feedbackState: "idle" | "correct" | "wrong" = !lastAnswerResult
    ? "idle"
    : lastAnswerResult.correct
    ? "correct"
    : "wrong";

  // Timer countdown
  useEffect(() => {
    if (gameOverResult) return;

    const interval = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOverResult]);

  const handleAnswerSubmit = useCallback(
    (answer: number) => {
      if (!currentQuestion) return;
      submitAnswer(gameId, currentQuestion.question.id, answer);
    },
    [currentQuestion, gameId, submitAnswer]
  );

  const handlePlayAgain = () => {
    resetGameState();
    startMatchmaking();
    router.push("/dashboard");
  };

  const handleReturnDashboard = () => {
    resetGameState();
    router.push("/dashboard");
  };

  const handleLeave = () => {
    if (confirm("Are you sure you want to forfeit this match?")) {
      leaveGame(gameId);
      router.push("/dashboard");
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const opponentName = activeGame?.opponent.username ?? "Opponent";
  const questionNumber = currentQuestion?.questionNumber ?? 1;
  const totalQuestions = currentQuestion?.totalQuestions ?? 10;
  const progressPercent = Math.min(100, Math.round(((questionNumber - 1) / totalQuestions) * 100));

  // ─── GAME OVER OVERLAY SCREEN ───────────────────────────────────────────────
  if (gameOverResult && gameOverResult.gameId === gameId) {
    const isWinner = gameOverResult.userResult === "WON";
    const isForfeit = gameOverResult.reason === "FORFEIT";
    const delta = gameOverResult.ratingChange;

    return (
      <div className="max-w-xl mx-auto py-12 px-4 sm:px-6">
        <div
          className="surface-card p-8 border-2 text-center relative overflow-hidden"
          style={{ borderColor: isWinner ? "#10B981" : "#EF4444" }}
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-[#1A2234] border border-[#242F45] flex items-center justify-center rounded">
            {isWinner ? (
              <TrophyIcon className="w-8 h-8 text-[#F59E0B]" />
            ) : (
              <SwordsIcon className="w-8 h-8 text-[#EF4444]" />
            )}
          </div>

          <h2
            className={`font-display font-bold text-3xl mb-1 ${
              isWinner ? "text-[#10B981]" : "text-[#EF4444]"
            }`}
          >
            {isWinner ? "VICTORY" : "DEFEAT"}
          </h2>

          <p className="text-xs font-mono uppercase tracking-wider text-[#94A3B8] mb-6">
            {isForfeit
              ? isWinner
                ? "Opponent forfeited match"
                : "You forfeited the match"
              : gameOverResult.reason === "TIME_LIMIT"
              ? "Time Limit Expired"
              : "All 10 Questions Completed"}
          </p>

          {/* Rating Change Display */}
          <div className="surface-elevated p-4 max-w-xs mx-auto mb-8 rounded">
            <div className="text-[11px] font-mono text-[#94A3B8] uppercase tracking-wider mb-1">
              Rating Update
            </div>
            <div className="flex items-center justify-center gap-3 font-mono font-bold">
              <span className="text-2xl text-[#F8FAFC]">
                {gameOverResult.newRating} ELO
              </span>
              <span
                className={`text-sm px-2 py-0.5 rounded ${
                  delta >= 0
                    ? "bg-[#064E3B] text-[#6EE7B7]"
                    : "bg-[#7F1D1D] text-[#FCA5A5]"
                }`}
              >
                {delta >= 0 ? `+${delta}` : delta}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handlePlayAgain}
              className="btn btn-primary text-sm px-6"
            >
              Play Again
            </button>
            <button
              onClick={handleReturnDashboard}
              className="btn btn-secondary text-sm px-6"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── ACTIVE GAMEPLAY SCREEN ────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 flex flex-col min-h-[calc(100vh-56px)]">
      {/* Top Combat Header */}
      <div className="surface-card p-4 mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          {/* Player 1 (You) */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#3B82F6] rounded-full" />
            <div>
              <div className="text-xs font-bold text-[#F8FAFC]">
                {user?.username ?? "You"}
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8]">
                YOU
              </div>
            </div>
          </div>

          {/* Center Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono font-bold text-sm ${
              timeLeft <= 20
                ? "bg-[#7F1D1D] text-[#FCA5A5] border border-[#DC2626] animate-pulse"
                : "bg-[#1A2234] text-[#F8FAFC] border border-[#334155]"
            }`}
          >
            <ClockIcon className="w-3.5 h-3.5 text-[#94A3B8]" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          {/* Opponent */}
          <div className="flex items-center gap-2 text-right">
            <div>
              <div className="text-xs font-bold text-[#F8FAFC]">
                {opponentName}
              </div>
              <div className="text-[10px] font-mono text-[#EF4444]">
                OPPONENT
              </div>
            </div>
            <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-full" />
          </div>
        </div>

        {/* Question Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-[#94A3B8]">
            <span>PROGRESS: QUESTION {questionNumber} OF {totalQuestions}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-[#0B0F17] h-1.5 rounded-full overflow-hidden border border-[#1E293B]">
            <div
              className="bg-[#3B82F6] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Primary Mathematical Combat Arena */}
      <div
        className={`surface-card p-8 sm:p-12 text-center flex-1 flex flex-col justify-center items-center my-auto transition-all ${
          feedbackState === "correct"
            ? "animate-correct-flash border-[#10B981]"
            : feedbackState === "wrong"
            ? "animate-wrong-shake border-[#EF4444]"
            : "border-[#1E293B]"
        }`}
      >
        <span className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-widest mb-6">
          SPEED ARITHMETIC #{questionNumber}
        </span>

        {/* Dominant Mathematical Expression */}
        {currentQuestion ? (
          <div className="font-mono font-extrabold text-5xl sm:text-7xl text-[#F8FAFC] tracking-tight mb-8 select-none flex items-center justify-center gap-4">
            <span>{currentQuestion.question.operation1}</span>
            <span className="text-[#3B82F6] font-normal">
              {SIGN_SYMBOLS[currentQuestion.question.sign] ?? "+"}
            </span>
            <span>{currentQuestion.question.operation2}</span>
            <span className="text-[#64748B] font-light">=</span>
            <span className="text-[#FCD34D]">?</span>
          </div>
        ) : (
          <div className="text-sm font-mono text-[#94A3B8] mb-8 animate-pulse">
            Loading next challenge...
          </div>
        )}

        {/* Answer Input Subcomponent Keyed by Question ID for natural reset */}
        {currentQuestion && (
          <QuestionInputForm
            key={currentQuestion.question.id}
            onSubmit={handleAnswerSubmit}
            isWrong={feedbackState === "wrong"}
            isCorrect={feedbackState === "correct"}
          />
        )}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-4 mt-auto">
        <span className="text-[11px] font-mono text-[#64748B]">
          MATCH ID: {gameId.slice(0, 8)}...
        </span>
        <button
          onClick={handleLeave}
          className="text-xs font-mono text-[#EF4444] hover:underline"
        >
          Forfeit Match
        </button>
      </div>
    </div>
  );
}
