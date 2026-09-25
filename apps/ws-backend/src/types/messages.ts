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

export const ChallengeFriendMessageSchema = z.object({
  type: z.literal("CHALLENGE_FRIEND"),
  payload: z.object({
    friendId: z.string().uuid("Invalid friendId"),
  }),
});

export const AcceptChallengeMessageSchema = z.object({
  type: z.literal("ACCEPT_CHALLENGE"),
  payload: z.object({
    challengeId: z.string().uuid("Invalid challengeId"),
  }),
});

export const DeclineChallengeMessageSchema = z.object({
  type: z.literal("DECLINE_CHALLENGE"),
  payload: z.object({
    challengeId: z.string().uuid("Invalid challengeId"),
  }),
});

export const CancelChallengeMessageSchema = z.object({
  type: z.literal("CANCEL_CHALLENGE"),
  payload: z.object({
    challengeId: z.string().uuid("Invalid challengeId"),
  }),
});

export const ClientMessageSchema = z.discriminatedUnion("type", [
  PlayGameMessageSchema,
  SubmitAnswerMessageSchema,
  CancelMatchmakingMessageSchema,
  LeaveGameMessageSchema,
  ChallengeFriendMessageSchema,
  AcceptChallengeMessageSchema,
  DeclineChallengeMessageSchema,
  CancelChallengeMessageSchema,
]);

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type PlayGameMessage = z.infer<typeof PlayGameMessageSchema>;
export type SubmitAnswerMessage = z.infer<typeof SubmitAnswerMessageSchema>;
export type CancelMatchmakingMessage = z.infer<typeof CancelMatchmakingMessageSchema>;
export type LeaveGameMessage = z.infer<typeof LeaveGameMessageSchema>;
export type ChallengeFriendMessage = z.infer<typeof ChallengeFriendMessageSchema>;
export type AcceptChallengeMessage = z.infer<typeof AcceptChallengeMessageSchema>;
export type DeclineChallengeMessage = z.infer<typeof DeclineChallengeMessageSchema>;
export type CancelChallengeMessage = z.infer<typeof CancelChallengeMessageSchema>;

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
      type: "CHALLENGE_RECEIVED";
      payload: {
        challengeId: string;
        challenger: {
          id: string;
          username: string;
          rating: number;
        };
        expiresAt: string;
      };
    }
  | {
      type: "CHALLENGE_ACCEPTED";
      payload: {
        challengeId: string;
        gameId: string;
      };
    }
  | {
      type: "CHALLENGE_DECLINED";
      payload: {
        challengeId: string;
        userId: string;
      };
    }
  | {
      type: "CHALLENGE_EXPIRED";
      payload: {
        challengeId: string;
      };
    }
  | {
      type: "CHALLENGE_CANCELLED";
      payload: {
        challengeId: string;
      };
    }
  | {
      type: "ERROR";
      payload: {
        code: string;
        message: string;
      };
    };

