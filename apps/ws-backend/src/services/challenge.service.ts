import { randomUUID } from "node:crypto";
import { db } from "@ClashIQ/db";
import { ConnectionManager } from "../handlers/connection.handler.js";
import type { ConnectedClient } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { gameService } from "./game.service.js";

export const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export interface ChallengeResult {
  success: boolean;
  code?: string;
  message?: string;
  challenge?: any;
}

export class ChallengeService {
  /**
   * Cleans up expired pending challenges in the database.
   */
  public async expireOutdatedChallenges(): Promise<void> {
    try {
      await db.gameChallenge.updateMany({
        where: {
          status: "PENDING",
          expiresAt: { lte: new Date() },
        },
        data: {
          status: "EXPIRED",
        },
      });
    } catch (err) {
      logger.error("Failed to expire outdated challenges", err);
    }
  }

  /**
   * Creates a challenge from the connected client to a friend.
   */
  public async createChallenge(
    challengerClient: ConnectedClient,
    friendId: string
  ): Promise<ChallengeResult> {
    const challengerId = challengerClient.user.id;

    // 1. Cannot challenge self
    if (challengerId === friendId) {
      return {
        success: false,
        code: "CANNOT_CHALLENGE_SELF",
        message: "You cannot challenge yourself",
      };
    }

    // 2. Target user must exist
    const targetUser = await db.user.findUnique({
      where: { id: friendId },
      include: { rating: true },
    });
    if (!targetUser) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: "Target user not found",
      };
    }

    // 3. Friendship verification (Must be ACCEPTED in DB)
    const friendship = await db.friends.findFirst({
      where: {
        friendStatus: "ACCEPTED",
        OR: [
          { senderId: challengerId, receiverId: friendId },
          { senderId: friendId, receiverId: challengerId },
        ],
      },
    });

    if (!friendship) {
      return {
        success: false,
        code: "NOT_FRIENDS",
        message: "You're not friends with this player",
      };
    }

    // 4. Challenger availability
    if (gameService.isPlayerInGame(challengerId)) {
      return {
        success: false,
        code: "CHALLENGER_IN_GAME",
        message: "Cannot challenge while in an active game",
      };
    }

    // 5. Target availability
    if (gameService.isPlayerInGame(friendId)) {
      return {
        success: false,
        code: "TARGET_IN_GAME",
        message: "This player is currently in a game",
      };
    }

    // 6. Clean up expired challenges
    await this.expireOutdatedChallenges();

    // 7. Check for existing pending challenge between these two users
    const existingPending = await db.gameChallenge.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { challengerId, challengedId: friendId },
          { challengerId: friendId, challengedId: challengerId },
        ],
      },
    });

    if (existingPending) {
      return {
        success: false,
        code: "DUPLICATE_CHALLENGE",
        message: "You already have a pending challenge with this player",
      };
    }

    // 8. Create persistent GameChallenge in DB (5 minute expiry window)
    const challengeId = randomUUID();
    const expiresAt = new Date(Date.now() + CHALLENGE_EXPIRY_MS);

    const challenge = await db.gameChallenge.create({
      data: {
        id: challengeId,
        challengerId,
        challengedId: friendId,
        status: "PENDING",
        expiresAt,
      },
    });

    logger.info("Game challenge created", {
      challengeId,
      challengerId,
      challengedId: friendId,
      expiresAt,
    });

    // 9. Fetch challenger's rating
    const challengerUser = await db.user.findUnique({
      where: { id: challengerId },
      include: { rating: true },
    });
    const challengerRating = challengerUser?.rating?.rating ?? 1000;

    // 10. Deliver real-time notification if target is currently online
    const targetClient = ConnectionManager.instance?.getClient(friendId);
    if (targetClient) {
      gameService.sendToSocket(targetClient.ws, {
        type: "CHALLENGE_RECEIVED",
        payload: {
          challengeId,
          challenger: {
            id: challengerId,
            username: challengerClient.user.username,
            rating: challengerRating,
          },
          expiresAt: expiresAt.toISOString(),
        },
      });
      logger.info("Challenge notification delivered to online player", {
        challengeId,
        targetId: friendId,
      });
    }

    return {
      success: true,
      challenge,
    };
  }

  /**
   * Accepts a pending challenge, validates state, and launches the game engine.
   */
  public async acceptChallenge(
    userId: string,
    challengeId: string
  ): Promise<ChallengeResult> {
    // 1. Fetch challenge with user & rating relations
    const challenge = await db.gameChallenge.findUnique({
      where: { id: challengeId },
      include: {
        challenger: { include: { rating: true } },
        challenged: { include: { rating: true } },
      },
    });

    if (!challenge) {
      return {
        success: false,
        code: "CHALLENGE_NOT_FOUND",
        message: "This challenge is no longer available",
      };
    }

    // 2. Verify target user is the authenticated challenged player
    if (challenge.challengedId !== userId) {
      return {
        success: false,
        code: "UNAUTHORIZED_CHALLENGE_ACCEPT",
        message: "You are not authorized to accept this challenge",
      };
    }

    // 3. Verify challenge is still PENDING
    if (challenge.status !== "PENDING") {
      return {
        success: false,
        code: "CHALLENGE_NOT_PENDING",
        message: "This challenge is no longer available",
      };
    }

    // 4. Verify not expired
    if (challenge.expiresAt <= new Date()) {
      await db.gameChallenge.update({
        where: { id: challengeId },
        data: { status: "EXPIRED" },
      });

      const client = ConnectionManager.instance?.getClient(userId);
      if (client) {
        gameService.sendToSocket(client.ws, {
          type: "CHALLENGE_EXPIRED",
          payload: { challengeId },
        });
      }

      return {
        success: false,
        code: "CHALLENGE_EXPIRED",
        message: "This challenge has expired",
      };
    }

    // 5. Verify availability: neither player can be currently in an active game
    if (gameService.isPlayerInGame(challenge.challengerId)) {
      return {
        success: false,
        code: "CHALLENGER_BUSY",
        message: "The challenger is currently in a game",
      };
    }

    if (gameService.isPlayerInGame(challenge.challengedId)) {
      return {
        success: false,
        code: "PLAYER_BUSY",
        message: "You are currently in an active game",
      };
    }

    // 6. Verify WebSocket connections for both players
    const challengerClient = ConnectionManager.instance?.getClient(challenge.challengerId);
    const challengedClient = ConnectionManager.instance?.getClient(challenge.challengedId);

    if (!challengerClient) {
      return {
        success: false,
        code: "CHALLENGER_OFFLINE",
        message: "The challenger is no longer online",
      };
    }

    if (!challengedClient) {
      return {
        success: false,
        code: "PLAYER_OFFLINE",
        message: "You must be online to accept the challenge",
      };
    }

    // 7. Atomic DB update: ensure challenge hasn't been concurrently accepted
    const updateResult = await db.gameChallenge.updateMany({
      where: {
        id: challengeId,
        status: "PENDING",
      },
      data: {
        status: "ACCEPTED",
      },
    });

    if (updateResult.count === 0) {
      return {
        success: false,
        code: "CHALLENGE_ALREADY_RESOLVED",
        message: "This challenge is no longer available",
      };
    }

    logger.info("Challenge accepted successfully", {
      challengeId,
      challengerId: challenge.challengerId,
      challengedId: challenge.challengedId,
    });

    // 8. Generate gameId and notify both players of challenge acceptance
    const gameId = randomUUID();

    gameService.sendToSocket(challengerClient.ws, {
      type: "CHALLENGE_ACCEPTED",
      payload: {
        challengeId,
        gameId,
      },
    });

    gameService.sendToSocket(challengedClient.ws, {
      type: "CHALLENGE_ACCEPTED",
      payload: {
        challengeId,
        gameId,
      },
    });

    // 9. Re-use existing game service to start the match!
    gameService.startGame(gameId, challengerClient, challengedClient);

    return {
      success: true,
      challenge,
    };
  }

  /**
   * Declines a challenge, updating DB and notifying the challenger.
   */
  public async declineChallenge(
    userId: string,
    challengeId: string
  ): Promise<ChallengeResult> {
    const challenge = await db.gameChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return {
        success: false,
        code: "CHALLENGE_NOT_FOUND",
        message: "Challenge not found",
      };
    }

    if (challenge.challengedId !== userId) {
      return {
        success: false,
        code: "UNAUTHORIZED_CHALLENGE_DECLINE",
        message: "You are not authorized to decline this challenge",
      };
    }

    if (challenge.status === "PENDING") {
      await db.gameChallenge.update({
        where: { id: challengeId },
        data: { status: "DECLINED" },
      });

      logger.info("Challenge declined", { challengeId, userId });

      // Notify challenger if connected
      const challengerClient = ConnectionManager.instance?.getClient(challenge.challengerId);
      if (challengerClient) {
        gameService.sendToSocket(challengerClient.ws, {
          type: "CHALLENGE_DECLINED",
          payload: {
            challengeId,
            userId,
          },
        });
      }
    }

    return { success: true };
  }

  /**
   * Cancels a pending challenge issued by the authenticated challenger.
   */
  public async cancelChallenge(
    userId: string,
    challengeId: string
  ): Promise<ChallengeResult> {
    const challenge = await db.gameChallenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return {
        success: false,
        code: "CHALLENGE_NOT_FOUND",
        message: "Challenge not found",
      };
    }

    if (challenge.challengerId !== userId) {
      return {
        success: false,
        code: "UNAUTHORIZED_CHALLENGE_CANCEL",
        message: "You are not authorized to cancel this challenge",
      };
    }

    if (challenge.status === "PENDING") {
      await db.gameChallenge.update({
        where: { id: challengeId },
        data: { status: "CANCELLED" },
      });

      logger.info("Challenge cancelled", { challengeId, userId });

      // Notify challenged user if online
      const targetClient = ConnectionManager.instance?.getClient(challenge.challengedId);
      if (targetClient) {
        gameService.sendToSocket(targetClient.ws, {
          type: "CHALLENGE_CANCELLED",
          payload: {
            challengeId,
          },
        });
      }
    }

    return { success: true };
  }
}

export const challengeService = new ChallengeService();
