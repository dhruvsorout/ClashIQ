import type { IncomingMessage } from "node:http";
import type { RawData, WebSocketServer } from "ws";
import { authenticateWebSocket } from "../middleware/auth.middleware.js";
import { gameService } from "../services/game.service.js";
import { matchmakingService } from "../services/matchmaking.service.js";
import type { ConnectedClient, ExtendedWs, OnlineUser, ServerMessage } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { MessageHandler } from "./message.handler.js";

export class ConnectionManager {
  private onlineUsers = new Map<string, ConnectedClient>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private wss: WebSocketServer) {
    this.startHeartbeat();
  }

  /**
   * Broadcasts a server message to all active connected sockets.
   */
  public broadcast(message: ServerMessage): void {
    const payloadStr = JSON.stringify(message);
    for (const client of this.onlineUsers.values()) {
      if (client.ws.readyState === 1) {
        try {
          client.ws.send(payloadStr);
        } catch (err) {
          logger.error("Error broadcasting to socket", err);
        }
      }
    }
  }

  /**
   * Broadcasts the list of currently online users to all clients.
   * Only sends sanitized OnlineUser records { id, username } — never raw sockets!
   */
  public broadcastOnlineUsers(): void {
    const users: OnlineUser[] = Array.from(this.onlineUsers.values()).map((c) => ({
      id: c.user.id,
      username: c.user.username,
    }));

    this.broadcast({
      type: "ONLINE_USERS",
      payload: { users },
    });
  }

  /**
   * Handles a new incoming WebSocket connection.
   * Implements message queueing during async authentication to avoid race conditions.
   */
  public async handleConnection(ws: ExtendedWs, req: IncomingMessage): Promise<void> {
    const messageQueue: RawData[] = [];
    let authenticated = false;
    let client: ConnectedClient | null = null;

    // Buffer any messages arriving while async auth is executing
    const initialMessageHandler = (data: RawData) => {
      if (authenticated && client) {
        MessageHandler.handleMessage(client, data).catch((err) => {
          logger.error("Unhandled error processing message", err);
        });
      } else {
        messageQueue.push(data);
      }
    };

    ws.on("message", initialMessageHandler);

    const authenticatedUser = await authenticateWebSocket(req);

    if (!authenticatedUser) {
      logger.warn("Closing unauthorized connection attempt");
      ws.off("message", initialMessageHandler);
      ws.close(4001, "Unauthorized");
      return;
    }

    const userId = authenticatedUser.id;

    // If an existing socket is open for this user, terminate it to prevent split-brain state
    const existingClient = this.onlineUsers.get(userId);
    if (existingClient && existingClient.ws !== ws && existingClient.ws.readyState === 1) {
      logger.info("Replacing existing socket for user", { userId });
      existingClient.ws.close(4000, "Superseded by new connection");
    }

    ws.userId = userId;
    ws.username = authenticatedUser.username;
    ws.isAlive = true;

    client = {
      user: authenticatedUser,
      ws,
    };

    this.onlineUsers.set(userId, client);
    authenticated = true;

    logger.info("User connected successfully", { userId, username: authenticatedUser.username });

    // Setup heartbeat listener
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Setup close listener
    ws.on("close", (code, reason) => {
      this.handleDisconnect(userId, code, reason.toString()).catch((err) => {
        logger.error("Error handling disconnect for user", err);
      });
    });

    // Setup socket error listener
    ws.on("error", (err) => {
      logger.error("Socket error on connection", { userId, error: err.message });
    });

    // Broadcast updated online users
    this.broadcastOnlineUsers();

    // Drain and process any messages received during authentication
    while (messageQueue.length > 0) {
      const queuedMessage = messageQueue.shift()!;
      MessageHandler.handleMessage(client, queuedMessage).catch((err) => {
        logger.error("Unhandled error processing queued message", err);
      });
    }
  }

  /**
   * Handles user disconnection: cleans up matchmaking, games, and notifies peers.
   */
  public async handleDisconnect(userId: string, code?: number, reason?: string): Promise<void> {
    logger.info("User disconnected", { userId, code, reason });

    // 1. Remove from online users
    this.onlineUsers.delete(userId);

    // 2. Remove from matchmaking queue if waiting
    matchmakingService.removePlayer(userId);

    // 3. Forfeit / clean up active game if playing
    await gameService.handlePlayerDisconnect(userId);

    // 4. Broadcast updated online users list
    this.broadcastOnlineUsers();
  }

  /**
   * Starts periodic ping heartbeat to detect stale/dead sockets.
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [userId, client] of this.onlineUsers.entries()) {
        if (!client.ws.isAlive) {
          logger.warn("Terminating dead socket (missed ping)", { userId });
          client.ws.terminate();
          this.onlineUsers.delete(userId);
          continue;
        }

        client.ws.isAlive = false;
        client.ws.ping();
      }
    }, 30000);
  }

  /**
   * Cleans up resources on server shutdown.
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    for (const client of this.onlineUsers.values()) {
      client.ws.close(1001, "Server shutting down");
    }
    this.onlineUsers.clear();
  }
}
