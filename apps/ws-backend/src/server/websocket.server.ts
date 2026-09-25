import { WebSocketServer } from "ws";
import { ConnectionManager } from "../handlers/connection.handler.js";
import type { ExtendedWs } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class GameWebSocketServer {
  private wss: WebSocketServer | null = null;
  private connectionManager: ConnectionManager | null = null;

  constructor(private port: number = 8080) {}

  public start(): WebSocketServer {
    this.wss = new WebSocketServer({ port: this.port });
    this.connectionManager = new ConnectionManager(this.wss);

    this.wss.on("connection", (ws: ExtendedWs, req) => {
      this.connectionManager?.handleConnection(ws, req).catch((err) => {
        logger.error("Error during connection handling", err);
      });
    });

    this.wss.on("listening", () => {
      logger.info(`WebSocket server is running on ws://localhost:${this.port}`);
    });

    this.wss.on("error", (err) => {
      logger.error("WebSocket server error", err);
    });

    return this.wss;
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.connectionManager?.shutdown();
      if (this.wss) {
        this.wss.close(() => {
          logger.info("WebSocket server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
