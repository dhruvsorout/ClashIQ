"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { AuthContext } from "./AuthContext";
import type { OnlineUser, Question, WsServerMessage } from "@/lib/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

interface WebSocketContextValue {
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  pendingGameRequest: string | null; // gameId
  currentQuestion: { gameId: string; question: Question } | null;
  sendPlayGame: () => void;
  sendAnswer: (gameId: string, questionId: string, answer: number) => void;
  clearGameRequest: () => void;
  clearQuestion: () => void;
}

export const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  onlineUsers: [],
  pendingGameRequest: null,
  currentQuestion: null,
  sendPlayGame: () => {},
  sendAnswer: () => {},
  clearGameRequest: () => {},
  clearQuestion: () => {},
});

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token } = useContext(AuthContext);
  const wsRef = useRef<WebSocket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [pendingGameRequest, setPendingGameRequest] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<{
    gameId: string;
    question: Question;
  } | null>(null);

  useEffect(() => {
    if (!token) {
      // Close existing connection if token disappears (logout)
      wsRef.current?.close();
      wsRef.current = null;
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    // Avoid duplicate connections
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsServerMessage;

        switch (msg.type) {
          case "ONLINE_USERS": {
            // msg.payload.users is [string, {id, name}][] (Map entries)
            const users: OnlineUser[] = msg.payload.users.map(([, u]) => ({
              id: u.id,
              name: u.name,
            }));
            setOnlineUsers(users);
            break;
          }

          case "GAME_REQUEST": {
            setPendingGameRequest(msg.payload.gameId);
            break;
          }

          case "QUESTION": {
            setCurrentQuestion({
              gameId: msg.payload.gameId,
              question: msg.payload.question,
            });
            break;
          }
        }
      } catch (e) {
        console.error("[WS] Failed to parse message:", e);
      }
    };

    return () => {
      ws.close();
    };
  }, [token]);

  const sendMessage = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const sendPlayGame = useCallback(() => {
    sendMessage({ type: "PLAY_GAME", payload: {} });
  }, [sendMessage]);

  const sendAnswer = useCallback(
    (gameId: string, questionId: string, answer: number) => {
      sendMessage({ type: "SUBMIT_ANSWER", payload: { gameId, questionId, answer } });
    },
    [sendMessage]
  );

  const clearGameRequest = useCallback(() => setPendingGameRequest(null), []);
  const clearQuestion = useCallback(() => setCurrentQuestion(null), []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        onlineUsers,
        pendingGameRequest,
        currentQuestion,
        sendPlayGame,
        sendAnswer,
        clearGameRequest,
        clearQuestion,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}
