export type QuestionSign = "PLUS" | "MINUS" | "DIVIDE" | "MULTIPLICATION";

export interface ClientQuestion {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
}

export interface OnlineUser {
  id: string;
  username: string;
}

export type GameOverReason = "COMPLETED" | "FORFEIT" | "TIME_LIMIT";
export type PlayerGameResult = "WON" | "LOSS" | "DRAW";

// Server -> Client WebSocket Events
export type WsServerMessage =
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

// Client -> Server WebSocket Events
export type WsClientMessage =
  | {
      type: "PLAY_GAME";
      payload?: Record<string, unknown>;
    }
  | {
      type: "CANCEL_MATCHMAKING";
      payload?: Record<string, unknown>;
    }
  | {
      type: "SUBMIT_ANSWER";
      payload: {
        gameId: string;
        questionId: string;
        answer: number;
      };
    }
  | {
      type: "LEAVE_GAME";
      payload: {
        gameId: string;
      };
    }
  | {
      type: "CHALLENGE_FRIEND";
      payload: {
        friendId: string;
      };
    }
  | {
      type: "ACCEPT_CHALLENGE";
      payload: {
        challengeId: string;
      };
    }
  | {
      type: "DECLINE_CHALLENGE";
      payload: {
        challengeId: string;
      };
    }
  | {
      type: "CANCEL_CHALLENGE";
      payload: {
        challengeId: string;
      };
    };

export interface ChallengeUser {
  id: string;
  username: string;
  rating: number;
  email?: string;
}

export interface PendingChallenge {
  id: string;
  challenger: ChallengeUser;
  challenged?: ChallengeUser;
  createdAt: string;
  expiresAt: string;
}


// HTTP API Data Types
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  rating: number | null;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  rating: number | null;
}

export interface UserStats {
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  rating: number;
}

export interface FriendUserInfo {
  id: string;
  username: string;
  email: string;
}

export interface FriendItem {
  friendshipId: string;
  friend: FriendUserInfo;
}

export interface FriendRecord {
  id: string;
  friendStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  sender: FriendUserInfo;
  receiver: FriendUserInfo;
}

export interface GameHistoryOpponent {
  userId: string;
  username: string;
  result: "WON" | "LOSS";
}

export interface GameHistoryItem {
  gameId: string;
  status: "OVER" | "RUNNING" | "SEARCHING_FOR_PLAYER";
  result: "WON" | "LOSS" | null;
  timeLimit: number;
  startedAt: string;
  endedAt: string;
  opponents: GameHistoryOpponent[];
}

export interface GameDetailQuestion {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
  systemAnswer: number;
}

export interface GameDetailAnswer {
  id: string;
  answer: number;
  questionId: string;
  userId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface GameDetailMember {
  id: string;
  status: "WON" | "LOSS";
  user: {
    id: string;
    username: string;
  };
}

export interface GameDetail {
  id: string;
  status: "OVER" | "RUNNING" | "SEARCHING_FOR_PLAYER";
  timeLimit: number;
  startedAt: string;
  endedAt: string;
  gameMember: GameDetailMember[];
  questions: GameDetailQuestion[];
  answers: GameDetailAnswer[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
