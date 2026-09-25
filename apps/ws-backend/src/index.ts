import { GameWebSocketServer } from "./server/websocket.server.js";
import { logger } from "./utils/logger.js";

const PORT = Number(process.env.WS_PORT || process.env.PORT || 8080);

const server = new GameWebSocketServer(PORT);
server.start();

const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled Rejection at Promise", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception thrown", error);
});