"use client";

import { use, useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { Question } from "@/lib/types";

const SIGN_SYMBOL: Record<string, string> = {
  PLUS: "+",
  MINUS: "−",
  MULTIPLICATION: "×",
  DIVIDE: "÷",
};

type AnswerState = "idle" | "correct" | "wrong";

export default function GamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const { token, isLoading: authLoading } = useAuth();
  const { currentQuestion, sendAnswer, clearQuestion } = useWebSocket();
  const router = useRouter();

  const [question, setQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [isGameOver, setIsGameOver] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const questionCardRef = useRef<HTMLDivElement>(null);

  // Redirect if not authed
  useEffect(() => {
    if (!authLoading && !token) {
      router.replace("/auth");
    }
  }, [authLoading, token, router]);

  // Pick up questions from the WS context
  useEffect(() => {
    if (currentQuestion && currentQuestion.gameId === gameId) {
      setQuestion(currentQuestion.question);
      setQuestionIndex((i) => (i === 0 ? 0 : i + 1));
      setUserAnswer("");
      setAnswerState("idle");
      clearQuestion();

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentQuestion, gameId, clearQuestion]);

  // If no question arrives after a while and we had correct, it's likely game over
  const gameOverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerCorrect = useCallback(() => {
    setAnswerState("correct");
    setLastCorrect(true);
    setQuestionIndex((i) => i + 1);

    if (questionCardRef.current) {
      questionCardRef.current.classList.add("animate-correct");
      setTimeout(
        () => questionCardRef.current?.classList.remove("animate-correct"),
        700
      );
    }

    // Start game-over timer — if no new question arrives in 3s, game is over
    if (gameOverTimerRef.current) clearTimeout(gameOverTimerRef.current);
    gameOverTimerRef.current = setTimeout(() => {
      setIsGameOver(true);
    }, 3000);
  }, []);

  const triggerWrong = useCallback(() => {
    setAnswerState("wrong");
    setLastCorrect(false);

    if (questionCardRef.current) {
      questionCardRef.current.classList.add("animate-shake");
      setTimeout(
        () => questionCardRef.current?.classList.remove("animate-shake"),
        500
      );
    }

    setTimeout(() => setAnswerState("idle"), 500);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || answerState === "correct") return;

    const parsed = parseFloat(userAnswer);
    if (isNaN(parsed)) {
      triggerWrong();
      return;
    }

    sendAnswer(gameId, question.id, parsed);

    // Check locally for immediate feedback
    if (parsed === question.answer) {
      triggerCorrect();
    } else {
      triggerWrong();
      setUserAnswer("");
    }
  };

  // Cancel game-over timer if a new question arrives
  useEffect(() => {
    if (question && gameOverTimerRef.current) {
      clearTimeout(gameOverTimerRef.current);
    }
  }, [question]);

  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "var(--text-muted)",
        }}
      >
        Loading…
      </div>
    );
  }

  // Game Over screen
  if (isGameOver) {
    return (
      <div
        className="page-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <div
          className="orb orb-purple"
          style={{ width: 500, height: 500, top: "10%", left: "20%", opacity: 0.4 }}
        />
        <div
          className="card animate-fade-in-up"
          style={{
            maxWidth: 480,
            width: "100%",
            padding: "3rem",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
            {lastCorrect ? "🏆" : "💀"}
          </div>
          <h1 className="heading-lg" style={{ marginBottom: "0.5rem" }}>
            {lastCorrect ? (
              <span className="gradient-text-gold">You Won!</span>
            ) : (
              <span style={{ color: "var(--danger)" }}>Game Over</span>
            )}
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
            {lastCorrect
              ? "Incredible performance! You blazed through all the questions."
              : "Better luck next time. Practice makes perfect!"}
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for first question
  if (!question) {
    return (
      <div
        className="page-container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: "1.5rem",
          color: "var(--text-secondary)",
        }}
      >
        <div
          className="orb orb-purple"
          style={{ width: 400, height: 400, top: "20%", left: "30%", opacity: 0.3 }}
        />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              border: "3px solid rgba(139,92,246,0.2)",
              borderTopColor: "var(--accent-primary)",
              borderRadius: "50%",
              animation: "spin-slow 1s linear infinite",
              margin: "0 auto 1.5rem",
            }}
          />
          <p className="heading-md" style={{ color: "var(--text-primary)" }}>
            Waiting for game to start…
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            Both players need to click <strong>Play Now</strong>
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-ghost btn-sm"
            style={{ marginTop: "2rem" }}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const signSymbol = SIGN_SYMBOL[question.sign] ?? "?";

  return (
    <div className="page-container" style={{ minHeight: "100vh", padding: "0 1rem" }}>
      {/* Orbs */}
      <div
        className="orb orb-purple"
        style={{ width: 500, height: 500, top: 0, right: "-5%", opacity: 0.25 }}
      />
      <div
        className="orb orb-indigo"
        style={{ width: 350, height: 350, bottom: "5%", left: "-5%", opacity: 0.2 }}
      />

      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo gradient-text">ClashIQ</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
          }}
        >
          <div className="badge badge-accent">⚔️ In Battle</div>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn btn-ghost btn-sm"
          >
            Quit
          </button>
        </div>
      </nav>

      {/* Game content */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          paddingTop: "5rem",
          paddingBottom: "3rem",
          position: "relative",
          zIndex: 1,
          gap: "2rem",
        }}
      >
        {/* Progress */}
        <div
          className="animate-fade-in"
          style={{ width: "100%", maxWidth: 560, display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            <span>Question {questionIndex + 1}</span>
            <span>Game ID: {gameId.slice(0, 8)}…</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(((questionIndex + 1) / 60) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          ref={questionCardRef}
          className="question-card animate-fade-in-up"
          style={{
            width: "100%",
            maxWidth: 560,
            transition: "border-color 0.3s",
            borderColor:
              answerState === "correct"
                ? "var(--success)"
                : answerState === "wrong"
                  ? "var(--danger)"
                  : "var(--border-accent)",
          }}
        >
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "1rem",
            }}
          >
            What is the answer?
          </p>
          <p className="question-text">
            <span style={{ color: "var(--text-primary)" }}>{question.operation1}</span>
            <span className="gradient-text" style={{ margin: "0 1rem" }}>
              {signSymbol}
            </span>
            <span style={{ color: "var(--text-primary)" }}>{question.operation2}</span>
            <span style={{ color: "var(--text-muted)", margin: "0 0.5rem" }}>=</span>
            <span style={{ color: "var(--text-muted)" }}>?</span>
          </p>

          {/* Feedback */}
          {answerState === "correct" && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: "1.25rem",
                color: "var(--success)",
                fontWeight: 700,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              ✓ Correct! Loading next question…
            </div>
          )}
          {answerState === "wrong" && (
            <div
              className="animate-fade-in"
              style={{
                marginTop: "1.25rem",
                color: "var(--danger)",
                fontWeight: 600,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              ✗ Wrong answer, try again
            </div>
          )}
        </div>

        {/* Answer form */}
        <form
          onSubmit={handleSubmit}
          className="animate-fade-in-up"
          style={{
            width: "100%",
            maxWidth: 560,
            display: "flex",
            gap: "0.75rem",
            animationDelay: "0.15s",
            opacity: 0,
          }}
        >
          <input
            ref={inputRef}
            id="answer-input"
            className="input"
            type="number"
            placeholder="Your answer…"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            disabled={answerState === "correct"}
            style={{
              fontSize: "1.15rem",
              textAlign: "center",
              letterSpacing: "0.05em",
              flex: 1,
            }}
            autoFocus
          />
          <button
            type="submit"
            id="submit-answer-btn"
            className="btn btn-primary"
            disabled={answerState === "correct" || !userAnswer.trim()}
            style={{ padding: "0.875rem 2rem", fontSize: "1rem" }}
          >
            Submit
          </button>
        </form>

        {/* Tip */}
        <p
          className="animate-fade-in"
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            animationDelay: "0.25s",
          }}
        >
          Press <kbd style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1px 6px",
            fontSize: "0.75rem",
          }}>Enter</kbd> to submit
        </p>
      </main>
    </div>
  );
}
