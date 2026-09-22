export type QuestionSign = "PLUS" | "MINUS" | "DIVIDE" | "MULTIPLICATION";

export interface Question {
  id: string;
  operation1: number;
  operation2: number;
  sign: QuestionSign;
  answer: number;
}

export interface OnlineUser {
  id: string;
  name: string;
}

export interface Game {
  id: string;
  status: "SEARCHING_FOR_PLAYER" | "RUNNING" | "OVER";
}

// WS Message types — Server → Client
export type WsServerMessage =
  | {
      type: "ONLINE_USERS";
      payload: { users: [string, { id: string; name: string }][] };
    }
  | {
      type: "GAME_REQUEST";
      payload: { gameId: string };
    }
  | {
      type: "QUESTION";
      payload: { gameId: string; question: Question };
    };

// WS Message types — Client → Server
export type WsClientMessage =
  | { type: "PLAY_GAME"; payload: Record<string, never> }
  | { type: "SUBMIT_ANSWER"; payload: { gameId: string; questionId: string; answer: number } };

export interface AuthUser {
  email: string;
  username: string;
}
