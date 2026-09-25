import type { RawData } from "ws";
import { challengeService } from "../services/challenge.service.js";
import { gameService } from "../services/game.service.js";
import { matchmakingService } from "../services/matchmaking.service.js";
import {
  ClientMessageSchema,
  type ConnectedClient,
  type ServerMessage,
} from "../types/index.js";
import { logger } from "../utils/logger.js";

export class MessageHandler {
  /**
   * Helper to send a typed message to the socket.
   */
  private static send(ws: ConnectedClient["ws"], message: ServerMessage): void {
    gameService.sendToSocket(ws, message);
  }

  /**
   * Dispatches and processes an incoming raw WebSocket message.
   */
  public static async handleMessage(client: ConnectedClient, rawData: RawData): Promise<void> {
    const { user, ws } = client;

    // 1. Safe JSON parsing
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawData.toString());
    } catch {
      logger.warn("Received malformed JSON message from client", { userId: user.id });
      this.send(ws, {
        type: "ERROR",
        payload: {
          code: "MALFORMED_JSON",
          message: "Failed to parse message as JSON",
        },
      });
      return;
    }

    // 2. Validate message structure using Zod
    const validationResult = ClientMessageSchema.safeParse(parsed);
    if (!validationResult.success) {
      const issue = validationResult.error.issues[0];
      const errorMessage = issue ? `${issue.path.join(".")}: ${issue.message}` : "Invalid message payload";
      logger.warn("Invalid message structure received", { userId: user.id, error: errorMessage });
      this.send(ws, {
        type: "ERROR",
        payload: {
          code: "INVALID_MESSAGE_PAYLOAD",
          message: errorMessage,
        },
      });
      return;
    }

    const message = validationResult.data;

    // 3. Dispatch to appropriate service
    switch (message.type) {
      case "PLAY_GAME": {
        // Prevent player from queueing if already in an active game
        if (gameService.isPlayerInGame(user.id)) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: "ALREADY_IN_GAME",
              message: "Cannot start a new game while currently in an active game",
            },
          });
          return;
        }

        const matchResult = matchmakingService.findOrCreateMatch(client);
        if (!matchResult.matched) {
          // Waiting in queue
          this.send(ws, {
            type: "GAME_REQUEST",
            payload: {
              gameId: matchResult.gameId,
            },
          });
        } else {
          // Match made: Start game!
          gameService.startGame(matchResult.gameId, matchResult.player1, matchResult.player2);
        }
        break;
      }

      case "CANCEL_MATCHMAKING": {
        const removed = matchmakingService.removePlayer(user.id);
        if (removed) {
          logger.info("Matchmaking cancelled by user", { userId: user.id });
        }
        break;
      }

      case "SUBMIT_ANSWER": {
        const { gameId, questionId, answer } = message.payload;
        const result = await gameService.submitAnswer(user.id, gameId, questionId, answer);

        if (!result.success && result.error) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: result.error,
              message: `Answer submission rejected: ${result.error}`,
            },
          });
        }
        break;
      }

      case "LEAVE_GAME": {
        const { gameId } = message.payload;
        await gameService.leaveGame(user.id, gameId);
        break;
      }

      case "CHALLENGE_FRIEND": {
        const { friendId } = message.payload;
        const result = await challengeService.createChallenge(client, friendId);
        if (!result.success) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: result.code || "CHALLENGE_FAILED",
              message: result.message || "Failed to send challenge",
            },
          });
        }
        break;
      }

      case "ACCEPT_CHALLENGE": {
        const { challengeId } = message.payload;
        const result = await challengeService.acceptChallenge(user.id, challengeId);
        if (!result.success) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: result.code || "ACCEPT_CHALLENGE_FAILED",
              message: result.message || "Failed to accept challenge",
            },
          });
        }
        break;
      }

      case "DECLINE_CHALLENGE": {
        const { challengeId } = message.payload;
        const result = await challengeService.declineChallenge(user.id, challengeId);
        if (!result.success) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: result.code || "DECLINE_CHALLENGE_FAILED",
              message: result.message || "Failed to decline challenge",
            },
          });
        }
        break;
      }

      case "CANCEL_CHALLENGE": {
        const { challengeId } = message.payload;
        const result = await challengeService.cancelChallenge(user.id, challengeId);
        if (!result.success) {
          this.send(ws, {
            type: "ERROR",
            payload: {
              code: result.code || "CANCEL_CHALLENGE_FAILED",
              message: result.message || "Failed to cancel challenge",
            },
          });
        }
        break;
      }

      default: {
        this.send(ws, {
          type: "ERROR",
          payload: {
            code: "UNKNOWN_MESSAGE_TYPE",
            message: "Unsupported message type",
          },
        });
      }
    }
  }
}
