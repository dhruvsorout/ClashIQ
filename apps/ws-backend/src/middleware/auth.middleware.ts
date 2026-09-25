import type { IncomingMessage } from "node:http";
import jwt from "jsonwebtoken";
import { config } from "@ClashIQ/config";
import { db } from "@ClashIQ/db";
import type { OnlineUser } from "../types/index.js";
import { logger } from "../utils/logger.js";

const JWT_SECRET = config.jwtSecret;

export interface AuthResult {
  user: OnlineUser;
}

/**
 * Authenticates an incoming WebSocket connection request via JWT in query params.
 * e.g. ws://localhost:8080?token=<jwt>
 *
 * Verifies:
 * 1. Presence of token query parameter
 * 2. Valid JWT signature and payload
 * 3. Existence of user in database
 */
export const authenticateWebSocket = async (req: IncomingMessage): Promise<OnlineUser | null> => {
  const url = req.url;
  if (!url) {
    logger.warn("WebSocket handshake failed: Missing request URL");
    return null;
  }

  try {
    const parsedUrl = new URL(url, "http://localhost");
    const token = parsedUrl.searchParams.get("token");

    if (!token) {
      logger.warn("WebSocket handshake failed: Missing token in query params");
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string };

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      logger.warn("WebSocket handshake failed: Invalid token payload");
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true },
    });

    if (!user) {
      logger.warn("WebSocket handshake failed: User not found in database", { userId: decoded.userId });
      return null;
    }

    return {
      id: user.id,
      username: user.username,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      logger.warn("WebSocket handshake failed: Token expired");
    } else {
      logger.warn("WebSocket handshake failed: Token verification failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return null;
  }
};