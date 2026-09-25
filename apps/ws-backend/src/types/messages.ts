import { z } from "zod";
import type { ClientQuestion, GameOverReason, PlayerGameResult } from "./game.js";
import type { OnlineUser } from "./user.js";

// ==========================================
// ZOD SCHEMAS FOR CLIENT -> SERVER MESSAGES
// ==========================================

export const PlayGameMessageSchema = z.object({
  type: z.literal("PLAY_GAME"),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const SubmitAnswerMessageSchema = z.object({
  type: z.literal("SUBMIT_ANSWER"),
  payload: z.object({
    gameId: z.string().uuid("Invalid gameId"),
    questionId: z.string().uuid("Invalid questionId"),
    answer: z.number().int("Answer must be an integer"),
  }),
});

export const CancelMatchmakingMessageSchema = z.object({
  type: z.literal("CANCEL_MATCHMAKING"),
  payload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const LeaveGameMessageSchema = z.object({
  type: z.literal("LEAVE_GAME"),
  payload: z.object({
    gameId: z.string().uuid("Invalid gameId"),
  }),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  PlayGameMessageSchema,
  SubmitAnswerMessageSchema,
  CancelMatchmakingMessageSchema,
  LeaveGameMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type PlayGameMessage = z.infer<typeof PlayGameMessageSchema>;
export type SubmitAnswerMessage = z.infer<typeof SubmitAnswerMessageSchema>;
export type CancelMatchmakingMessage = z.infer<typeof CancelMatchmakingMessageSchema>;
export type LeaveGameMessage = z.infer<typeof LeaveGameMessageSchema>;

// ==========================================
// SERVER -> CLIENT MESSAGES (TYPED CONTRACTS)
// ==========================================

export type ServerMessage =
  | {
      type: "ONLINE_USERS";
      payload: {
        users: OnlineUser[];
      };
    }
  | {
      type: "GAME_REQUEST";
      payload: {
        gameId: string;
      };
    }
  | {
      type: "GAME_STARTED";
      payload: {
        gameId: string;
        opponent: OnlineUser;
        timeLimit: number;
        totalQuestions: number;
      };
    }
  | {
      type: "QUESTION";
      payload: {
        gameId: string;
        question: ClientQuestion;
        questionNumber: number;
        totalQuestions: number;
      };
    }
  | {
      type: "ANSWER_RESULT";
      payload: {
        gameId: string;
        questionId: string;
        correct: boolean;
      };
    }
  | {
      type: "GAME_OVER";
      payload: {
        gameId: string;
        winnerId: string | null;
        reason: GameOverReason;
        userResult: PlayerGameResult;
        ratingChange: number;
        newRating: number;
      };
    }
  | {
      type: "ERROR";
      payload: {
        code: string;
        message: string;
      };
    };
