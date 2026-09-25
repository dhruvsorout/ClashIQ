import { randomUUID } from "node:crypto";
import type { ConnectedClient, OnlineUser } from "../types/index.js";
import { logger } from "../utils/logger.js";

export interface WaitingMatch {
  gameId: string;
  player: ConnectedClient;
  createdAt: Date;
}

export type MatchResult =
  | {
      matched: false;
      gameId: string;
    }
  | {
      matched: true;
      gameId: string;
      player1: ConnectedClient;
      player2: ConnectedClient;
    };

export class MatchmakingService {
  private waitingMatch: WaitingMatch | null = null;

  /**
   * Checks if a player is currently in the matchmaking queue.
   */
  public isQueued(userId: string): boolean {
    return this.waitingMatch?.player.user.id === userId;
  }

  /**
   * Attempts to match a player.
   * If a waiting match exists (and socket is alive), pairs the two players.
   * Otherwise, queues the player.
   */
  public findOrCreateMatch(client: ConnectedClient): MatchResult {
    const userId = client.user.id;

    // 1. If already queued, return current waiting gameId
    if (this.waitingMatch && this.waitingMatch.player.user.id === userId) {
      logger.warn("Player already in matchmaking queue", { userId });
      return {
        matched: false,
        gameId: this.waitingMatch.gameId,
      };
    }

    // 2. Check if there is a waiting match
    if (this.waitingMatch) {
      const waitingPlayer = this.waitingMatch.player;

      // Verify that the waiting player's connection is still open
      if (waitingPlayer.ws.readyState !== 1) {
        logger.warn("Waiting player socket is no longer OPEN, removing from queue", {
          waitingUserId: waitingPlayer.user.id,
        });
        this.waitingMatch = null;
      } else {
        // Matched! Atomically clear the waiting match to prevent race conditions
        const matchedGameId = this.waitingMatch.gameId;
        const matchedPlayer1 = waitingPlayer;
        this.waitingMatch = null;

        logger.info("Match found!", {
          gameId: matchedGameId,
          player1: matchedPlayer1.user.id,
          player2: client.user.id,
        });

        return {
          matched: true,
          gameId: matchedGameId,
          player1: matchedPlayer1,
          player2: client,
        };
      }
    }

    // 3. No valid waiting match: create a new waiting match
    const newGameId = randomUUID();
    this.waitingMatch = {
      gameId: newGameId,
      player: client,
      createdAt: new Date(),
    };

    logger.info("Player queued for matchmaking", {
      gameId: newGameId,
      userId,
    });

    return {
      matched: false,
      gameId: newGameId,
    };
  }

  /**
   * Removes a player from the matchmaking queue (e.g. on disconnect or cancel).
   */
  public removePlayer(userId: string): boolean {
    if (this.waitingMatch && this.waitingMatch.player.user.id === userId) {
      logger.info("Player removed from matchmaking queue", { userId, gameId: this.waitingMatch.gameId });
      this.waitingMatch = null;
      return true;
    }
    return false;
  }

  /**
   * Gets the waiting match if any.
   */
  public getWaitingMatch(): WaitingMatch | null {
    return this.waitingMatch;
  }
}

export const matchmakingService = new MatchmakingService();
