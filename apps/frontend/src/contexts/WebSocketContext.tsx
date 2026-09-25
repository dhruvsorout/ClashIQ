"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AuthContext } from "./AuthContext";
import { getPendingChallenges } from "@/lib/api";
import type {
  ClientQuestion,
  GameOverReason,
  OnlineUser,
  PendingChallenge,
  PlayerGameResult,
  WsServerMessage,
} from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "ERROR";

export type MatchmakingState = "IDLE" | "SEARCHING" | "MATCHED";

export interface ActiveGameData {
  gameId: string;
  opponent: OnlineUser;
  timeLimit: number;
  totalQuestions: number;
}

export interface CurrentQuestionData {
  gameId: string;
  question: ClientQuestion;
  questionNumber: number;
  totalQuestions: number;
}

export interface GameOverData {
  gameId: string;
  winnerId: string | null;
  reason: GameOverReason;
  userResult: PlayerGameResult;
  ratingChange: number;
  newRating: number;
}

interface WebSocketContextValue {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  matchmakingState: MatchmakingState;
  pendingGameId: string | null;
  activeGame: ActiveGameData | null;
  currentQuestion: CurrentQuestionData | null;
  lastAnswerResult: { questionId: string; correct: boolean } | null;
  gameOverResult: GameOverData | null;
  lastError: { code: string; message: string } | null;

  // Friend Challenges
  incomingChallenges: PendingChallenge[];
  outgoingChallenges: PendingChallenge[];
  activeIncomingChallenge: PendingChallenge | null;

  startMatchmaking: () => void;
  cancelMatchmaking: () => void;
  submitAnswer: (gameId: string, questionId: string, answer: number) => void;
  leaveGame: (gameId: string) => void;
  resetGameState: () => void;
  clearError: () => void;

  challengeFriend: (friendId: string) => void;
  acceptChallenge: (challengeId: string) => void;
  declineChallenge: (challengeId: string) => void;
  cancelChallenge: (challengeId: string) => void;
  dismissChallengeModal: () => void;
  refreshChallenges: () => Promise<void>;
}

export const WebSocketContext = createContext<WebSocketContextValue>({
  connectionStatus: "DISCONNECTED",
  isConnected: false,
  onlineUsers: [],
  matchmakingState: "IDLE",
  pendingGameId: null,
  activeGame: null,
  currentQuestion: null,
  lastAnswerResult: null,
  gameOverResult: null,
  lastError: null,

  incomingChallenges: [],
  outgoingChallenges: [],
  activeIncomingChallenge: null,

  startMatchmaking: () => {},
  cancelMatchmaking: () => {},
  submitAnswer: () => {},
  leaveGame: () => {},
  resetGameState: () => {},
  clearError: () => {},

  challengeFriend: () => {},
  acceptChallenge: () => {},
  declineChallenge: () => {},
  cancelChallenge: () => {},
  dismissChallengeModal: () => {},
  refreshChallenges: async () => {},
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token, refreshUser, updateUserRating } = useContext(AuthContext);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(userToken: string) => void>(() => {});

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>("IDLE");
  const [pendingGameId, setPendingGameId] = useState<string | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGameData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionData | null>(null);
  const [lastAnswerResult, setLastAnswerResult] = useState<{
    questionId: string;
    correct: boolean;
  } | null>(null);
  const [gameOverResult, setGameOverResult] = useState<GameOverData | null>(null);
  const [lastError, setLastError] = useState<{ code: string; message: string } | null>(null);

  // Friend Challenges State
  const [incomingChallenges, setIncomingChallenges] = useState<PendingChallenge[]>([]);
  const [outgoingChallenges, setOutgoingChallenges] = useState<PendingChallenge[]>([]);
  const [activeIncomingChallenge, setActiveIncomingChallenge] = useState<PendingChallenge | null>(null);

  const connect = useCallback((userToken: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus((prev) => (prev === "DISCONNECTED" ? "CONNECTING" : "RECONNECTING"));

    const ws = new WebSocket(`${WS_URL}?token=${userToken}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("CONNECTED");
      reconnectAttemptsRef.current = 0;
    };

    ws.onclose = (event) => {
      wsRef.current = null;
      setConnectionStatus("DISCONNECTED");

      // Auto-reconnect if not closed intentionally or unauthorized
      if (event.code !== 4001 && event.code !== 1000 && token) {
        const backoff = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (token) connectRef.current(token);
        }, backoff);
      }
    };

    ws.onerror = () => {
      setConnectionStatus("ERROR");
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage;

        switch (msg.type) {
          case "ONLINE_USERS": {
            setOnlineUsers(msg.payload.users);
            break;
          }

          case "GAME_REQUEST": {
            setPendingGameId(msg.payload.gameId);
            setMatchmakingState("SEARCHING");
            break;
          }

          case "GAME_STARTED": {
            setActiveGame(msg.payload);
            setPendingGameId(null);
            setMatchmakingState("MATCHED");
            setGameOverResult(null);
            setLastAnswerResult(null);
            setActiveIncomingChallenge(null);
            break;
          }

          case "QUESTION": {
            setCurrentQuestion(msg.payload);
            setLastAnswerResult(null);
            break;
          }

          case "ANSWER_RESULT": {
            setLastAnswerResult({
              questionId: msg.payload.questionId,
              correct: msg.payload.correct,
            });
            break;
          }

          case "GAME_OVER": {
            setGameOverResult(msg.payload);
            setMatchmakingState("IDLE");
            updateUserRating(msg.payload.newRating);
            refreshUser();
            break;
          }

          case "CHALLENGE_RECEIVED": {
            const newChallenge: PendingChallenge = {
              id: msg.payload.challengeId,
              challenger: msg.payload.challenger,
              createdAt: new Date().toISOString(),
              expiresAt: msg.payload.expiresAt,
            };
            setIncomingChallenges((prev) => {
              const filtered = prev.filter((c) => c.id !== newChallenge.id);
              return [newChallenge, ...filtered];
            });
            setActiveIncomingChallenge(newChallenge);
            break;
          }

          case "CHALLENGE_ACCEPTED": {
            const { challengeId } = msg.payload;
            setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setOutgoingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setActiveIncomingChallenge((curr) => (curr?.id === challengeId ? null : curr));
            break;
          }

          case "CHALLENGE_DECLINED": {
            const { challengeId } = msg.payload;
            setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setOutgoingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setActiveIncomingChallenge((curr) => (curr?.id === challengeId ? null : curr));
            setLastError({
              code: "CHALLENGE_DECLINED",
              message: "Your game challenge was declined.",
            });
            break;
          }

          case "CHALLENGE_EXPIRED": {
            const { challengeId } = msg.payload;
            setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setOutgoingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setActiveIncomingChallenge((curr) => (curr?.id === challengeId ? null : curr));
            break;
          }

          case "CHALLENGE_CANCELLED": {
            const { challengeId } = msg.payload;
            setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
            setActiveIncomingChallenge((curr) => (curr?.id === challengeId ? null : curr));
            break;
          }

          case "ERROR": {
            setLastError(msg.payload);
            if (msg.payload.code === "ALREADY_IN_GAME") {
              setMatchmakingState("IDLE");
            }
            break;
          }
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };
  }, [token, refreshUser, updateUserRating]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    if (!token) {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close(1000, "User logged out");
      wsRef.current = null;
      return;
    }

    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted && token) {
        connect(token);
      }
    });

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [token, connect]);

  const sendRaw = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const startMatchmaking = useCallback(() => {
    setMatchmakingState("SEARCHING");
    setGameOverResult(null);
    sendRaw({ type: "PLAY_GAME", payload: {} });
  }, [sendRaw]);

  const cancelMatchmaking = useCallback(() => {
    setMatchmakingState("IDLE");
    setPendingGameId(null);
    sendRaw({ type: "CANCEL_MATCHMAKING", payload: {} });
  }, [sendRaw]);

  const submitAnswer = useCallback(
    (gameId: string, questionId: string, answer: number) => {
      sendRaw({
        type: "SUBMIT_ANSWER",
        payload: { gameId, questionId, answer },
      });
    },
    [sendRaw]
  );

  const leaveGame = useCallback(
    (gameId: string) => {
      sendRaw({
        type: "LEAVE_GAME",
        payload: { gameId },
      });
      setActiveGame(null);
      setCurrentQuestion(null);
      setMatchmakingState("IDLE");
    },
    [sendRaw]
  );

  const resetGameState = useCallback(() => {
    setActiveGame(null);
    setCurrentQuestion(null);
    setGameOverResult(null);
    setLastAnswerResult(null);
    setMatchmakingState("IDLE");
    setPendingGameId(null);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const challengeFriend = useCallback(
    (friendId: string) => {
      sendRaw({
        type: "CHALLENGE_FRIEND",
        payload: { friendId },
      });
    },
    [sendRaw]
  );

  const acceptChallenge = useCallback(
    (challengeId: string) => {
      sendRaw({
        type: "ACCEPT_CHALLENGE",
        payload: { challengeId },
      });
    },
    [sendRaw]
  );

  const declineChallenge = useCallback(
    (challengeId: string) => {
      sendRaw({
        type: "DECLINE_CHALLENGE",
        payload: { challengeId },
      });
      setIncomingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
      setActiveIncomingChallenge((curr) => (curr?.id === challengeId ? null : curr));
    },
    [sendRaw]
  );

  const cancelChallenge = useCallback(
    (challengeId: string) => {
      sendRaw({
        type: "CANCEL_CHALLENGE",
        payload: { challengeId },
      });
      setOutgoingChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    },
    [sendRaw]
  );

  const dismissChallengeModal = useCallback(() => {
    setActiveIncomingChallenge(null);
  }, []);

  const refreshChallenges = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getPendingChallenges(token);
      if (res) {
        setIncomingChallenges(res.incoming || []);
        setOutgoingChallenges(res.outgoing || []);
        if (res.incoming && res.incoming.length > 0) {
          setActiveIncomingChallenge((curr) => curr ?? res.incoming[0] ?? null);
        }
      }
    } catch {
      // Silently catch background polling errors
    }
  }, [token]);

  // Load persistent pending challenges whenever authenticated
  useEffect(() => {
    if (token) {
      refreshChallenges();
    }
  }, [token, refreshChallenges]);

  return (
    <WebSocketContext.Provider
      value={{
        connectionStatus,
        isConnected: connectionStatus === "CONNECTED",
        onlineUsers,
        matchmakingState,
        pendingGameId,
        activeGame,
        currentQuestion,
        lastAnswerResult,
        gameOverResult,
        lastError,
        incomingChallenges,
        outgoingChallenges,
        activeIncomingChallenge,
        startMatchmaking,
        cancelMatchmaking,
        submitAnswer,
        leaveGame,
        resetGameState,
        clearError,
        challengeFriend,
        acceptChallenge,
        declineChallenge,
        cancelChallenge,
        dismissChallengeModal,
        refreshChallenges,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
