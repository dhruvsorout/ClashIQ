import type { WebSocket } from "ws";

export interface ExtendedWs extends WebSocket {
  userId?: string;
  username?: string;
  isAlive?: boolean;
}

export interface OnlineUser {
  id: string;
  username: string;
}

export interface ConnectedClient {
  user: OnlineUser;
  ws: ExtendedWs;
}
