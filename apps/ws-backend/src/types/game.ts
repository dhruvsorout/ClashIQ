import type { ExtendedWs, OnlineUser } from "./user.js";

export type QuestionSign = "PLUS" | "MINUS" | "DIVIDE" | "MULTIPLICATION";

export interface ServerQuestion {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
  systemAnswer: number;
}

export interface ClientQuestion {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
}

export interface PlayerAnswerRecord {
  questionId: string;
  answer: number;
  isCorrect: boolean;
  answeredAt: Date;
}

export interface PlayerGameState {
  user: OnlineUser;
  ws: ExtendedWs;
  currentQuestionIndex: number;
  completed: boolean;
  answers: PlayerAnswerRecord[];
}

export type GameStatus = "SEARCHING_FOR_PLAYER" | "RUNNING" | "OVER";

export interface GameState {
  id: string;
  status: GameStatus;
  adminId: string;
  timeLimit: number;
  startedAt: Date;
  endedAt?: Date;
  questions: ServerQuestion[];
  players: Map<string, PlayerGameState>;
}

export type GameOverReason = "COMPLETED" | "FORFEIT" | "TIME_LIMIT";
export type PlayerGameResult = "WON" | "LOSS" | "DRAW";
