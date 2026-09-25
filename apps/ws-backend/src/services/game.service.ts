import { db } from "@ClashIQ/db";
import type {
  ConnectedClient,
  GameOverReason,
  GameState,
  PlayerGameResult,
  PlayerGameState,
  ServerMessage,
  ServerQuestion,
} from "../types/index.js";
import { logger } from "../utils/logger.js";
import { QuestionService } from "./question.service.js";
import { RatingResult, RatingService } from "./rating.service.js";

export class GameService {
  private games = new Map<string, GameState>();
  private playerGameMap = new Map<string, string>(); // userId -> gameId
  private gameTimers = new Map<string, NodeJS.Timeout>(); // gameId -> timeout

  /**
   * Helper to safely send a typed message to a client WebSocket.
   */
  public sendToSocket(ws: ConnectedClient["ws"], message: ServerMessage): void {
    if (ws.readyState === 1) {
      // 1 = OPEN
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        logger.error("Failed to send message to WebSocket", err);
      }
    }
  }

  /**
   * Checks if a player is currently in an active game.
   */
  public isPlayerInGame(userId: string): boolean {
    return this.playerGameMap.has(userId);
  }

  /**
   * Gets the active game ID for a player.
   */
  public getGameIdForPlayer(userId: string): string | undefined {
    return this.playerGameMap.get(userId);
  }

  /**
   * Gets a game by its ID.
   */
  public getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId);
  }

  /**
   * Starts a 1v1 game between two matched players.
   */
  public startGame(gameId: string, player1: ConnectedClient, player2: ConnectedClient, timeLimit = 120): GameState {
    const questions = QuestionService.generateGameQuestions(10);

    const players = new Map<string, PlayerGameState>();
    players.set(player1.user.id, {
      user: player1.user,
      ws: player1.ws,
      currentQuestionIndex: 0,
      completed: false,
      answers: [],
    });

    players.set(player2.user.id, {
      user: player2.user,
      ws: player2.ws,
      currentQuestionIndex: 0,
      completed: false,
      answers: [],
    });

    const gameState: GameState = {
      id: gameId,
      status: "RUNNING",
      adminId: player1.user.id,
      timeLimit,
      startedAt: new Date(),
      questions,
      players,
    };

    this.games.set(gameId, gameState);
    this.playerGameMap.set(player1.user.id, gameId);
    this.playerGameMap.set(player2.user.id, gameId);

    // Notify Player 1
    this.sendToSocket(player1.ws, {
      type: "GAME_STARTED",
      payload: {
        gameId,
        opponent: player2.user,
        timeLimit,
        totalQuestions: questions.length,
      },
    });

    // Notify Player 2
    this.sendToSocket(player2.ws, {
      type: "GAME_STARTED",
      payload: {
        gameId,
        opponent: player1.user,
        timeLimit,
        totalQuestions: questions.length,
      },
    });

    // Send first question to both players (answers stripped!)
    const firstQuestion = questions[0]!;
    const clientFirstQuestion = QuestionService.toClientQuestion(firstQuestion);

    this.sendToSocket(player1.ws, {
      type: "QUESTION",
      payload: {
        gameId,
        question: clientFirstQuestion,
        questionNumber: 1,
        totalQuestions: questions.length,
      },
    });

    this.sendToSocket(player2.ws, {
      type: "QUESTION",
      payload: {
        gameId,
        question: clientFirstQuestion,
        questionNumber: 1,
        totalQuestions: questions.length,
      },
    });

    // Set time-limit timer
    const timer = setTimeout(() => {
      this.handleGameTimeout(gameId).catch((err) => {
        logger.error(`Error during game timeout handling for game ${gameId}`, err);
      });
    }, timeLimit * 1000);

    this.gameTimers.set(gameId, timer);

    logger.info("Game started", {
      gameId,
      player1: player1.user.id,
      player2: player2.user.id,
      questionCount: questions.length,
    });

    return gameState;
  }

  /**
   * Handles an answer submission from a player.
   */
  public async submitAnswer(
    userId: string,
    gameId: string,
    questionId: string,
    answer: number
  ): Promise<{ success: boolean; error?: string }> {
    const game = this.games.get(gameId);
    if (!game) {
      return { success: false, error: "GAME_NOT_FOUND" };
    }

    if (game.status !== "RUNNING") {
      return { success: false, error: "GAME_NOT_RUNNING" };
    }

    const playerState = game.players.get(userId);
    if (!playerState) {
      return { success: false, error: "UNAUTHORIZED_GAME_ACCESS" };
    }

    if (playerState.completed) {
      return { success: false, error: "ALREADY_COMPLETED" };
    }

    const currentQuestion = game.questions[playerState.currentQuestionIndex];
    if (!currentQuestion) {
      return { success: false, error: "NO_ACTIVE_QUESTION" };
    }

    // Verify the submitted question is the player's current question
    if (currentQuestion.id !== questionId) {
      return { success: false, error: "INVALID_QUESTION_SEQUENCE" };
    }

    const isCorrect = answer === currentQuestion.systemAnswer;

    // Record answer submission
    playerState.answers.push({
      questionId,
      answer,
      isCorrect,
      answeredAt: new Date(),
    });

    // Send answer result back to the submitting player
    this.sendToSocket(playerState.ws, {
      type: "ANSWER_RESULT",
      payload: {
        gameId,
        questionId,
        correct: isCorrect,
      },
    });

    if (!isCorrect) {
      logger.debug("Player answered incorrectly", { userId, gameId, questionId, answer });
      return { success: true };
    }

    // Correct answer: advance player progress
    playerState.currentQuestionIndex += 1;
    logger.debug("Player answered correctly", {
      userId,
      gameId,
      newQuestionIndex: playerState.currentQuestionIndex,
      total: game.questions.length,
    });

    // Check if player has more questions
    if (playerState.currentQuestionIndex < game.questions.length) {
      const nextQuestion = game.questions[playerState.currentQuestionIndex]!;
      const clientNextQuestion = QuestionService.toClientQuestion(nextQuestion);

      this.sendToSocket(playerState.ws, {
        type: "QUESTION",
        payload: {
          gameId,
          question: clientNextQuestion,
          questionNumber: playerState.currentQuestionIndex + 1,
          totalQuestions: game.questions.length,
        },
      });

      return { success: true };
    }

    // Player finished all questions! This player WINS!
    playerState.completed = true;
    await this.completeGame(game, userId, "COMPLETED");

    return { success: true };
  }

  /**
   * Completes a game, persists results to PostgreSQL atomically, updates Elo, and cleans up memory.
   */
  public async completeGame(game: GameState, winnerId: string | null, reason: GameOverReason): Promise<void> {
    if (game.status === "OVER") {
      return;
    }

    game.status = "OVER";
    game.endedAt = new Date();

    // Clear timeout timer
    const timer = this.gameTimers.get(game.id);
    if (timer) {
      clearTimeout(timer);
      this.gameTimers.delete(game.id);
    }

    // Determine players
    const playerList = Array.from(game.players.values());
    const player1 = playerList[0]!;
    const player2 = playerList[1]!;

    let loserId: string | null = null;
    if (winnerId) {
      loserId = player1.user.id === winnerId ? player2.user.id : player1.user.id;
    }

    let ratingResult: RatingResult | null = null;

    try {
      // Collect all submitted answers across both players
      const allAnswersToPersist: { questionId: string; answer: number; userId: string }[] = [];
      for (const p of playerList) {
        for (const a of p.answers) {
          allAnswersToPersist.push({
            questionId: a.questionId,
            answer: a.answer,
            userId: p.user.id,
          });
        }
      }

      // Execute database persistence in an atomic transaction
      await db.$transaction(async (tx) => {
        // 1. Create Game record with nested GameMember and Question relations
        await tx.game.create({
          data: {
            id: game.id,
            timeLimit: game.timeLimit,
            startedAt: game.startedAt,
            endedAt: game.endedAt ?? new Date(),
            status: "OVER",
            gameMember: {
              create: playerList.map((p) => ({
                userId: p.user.id,
                status: p.user.id === winnerId ? "WON" : "LOSS",
              })),
            },
            questions: {
              create: game.questions.map((q) => ({
                id: q.id,
                operation1: q.operation1,
                operation2: q.operation2,
                sign: q.sign,
                systemAnswer: q.systemAnswer,
              })),
            },
            answers: {
              create: allAnswersToPersist.map((a) => ({
                questionId: a.questionId,
                answer: a.answer,
                userId: a.userId,
              })),
            },
          },
        });

        // 2. Update Elo ratings if there is a decisive winner
        if (winnerId && loserId) {
          ratingResult = await RatingService.updateMatchRatings(winnerId, loserId, tx);
        }
      });

      logger.info("Persisted game to database successfully", { gameId: game.id, winnerId, reason });
    } catch (err) {
      logger.error("Failed to persist game completion to database", err);
    }

    // Broadcast GAME_OVER to both players
    for (const p of playerList) {
      const isWinner = p.user.id === winnerId;
      const userResult: PlayerGameResult = winnerId === null ? "DRAW" : isWinner ? "WON" : "LOSS";

      let ratingChange = 0;
      let newRating = 1000;

      if (ratingResult) {
        if (isWinner) {
          ratingChange = (ratingResult as RatingResult).winnerDelta;
          newRating = (ratingResult as RatingResult).winnerNewRating;
        } else {
          ratingChange = -(ratingResult as RatingResult).loserDelta;
          newRating = (ratingResult as RatingResult).loserNewRating;
        }
      }

      this.sendToSocket(p.ws, {
        type: "GAME_OVER",
        payload: {
          gameId: game.id,
          winnerId,
          reason,
          userResult,
          ratingChange,
          newRating,
        },
      });
    }

    // Cleanup in-memory game state
    this.games.delete(game.id);
    for (const p of playerList) {
      this.playerGameMap.delete(p.user.id);
    }
  }

  /**
   * Handles player disconnection during a game.
   * If game is RUNNING, the opponent wins by FORFEIT.
   */
  public async handlePlayerDisconnect(userId: string): Promise<void> {
    const gameId = this.playerGameMap.get(userId);
    if (!gameId) {
      return;
    }

    const game = this.games.get(gameId);
    if (!game) {
      this.playerGameMap.delete(userId);
      return;
    }

    logger.info("Player disconnected during active game", { userId, gameId, status: game.status });

    if (game.status === "RUNNING") {
      // Find the remaining opponent
      const opponent = Array.from(game.players.values()).find((p) => p.user.id !== userId);
      const winnerId = opponent ? opponent.user.id : null;

      await this.completeGame(game, winnerId, "FORFEIT");
    } else {
      // Cleanup game if still searching or other status
      this.games.delete(gameId);
      for (const p of game.players.values()) {
        this.playerGameMap.delete(p.user.id);
      }
    }
  }

  /**
   * Handles explicit player leave game request.
   */
  public async leaveGame(userId: string, gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game || !game.players.has(userId)) {
      return;
    }

    if (game.status === "RUNNING") {
      const opponent = Array.from(game.players.values()).find((p) => p.user.id !== userId);
      const winnerId = opponent ? opponent.user.id : null;
      await this.completeGame(game, winnerId, "FORFEIT");
    }
  }

  /**
   * Handles game expiration when timeLimit is reached.
   */
  private async handleGameTimeout(gameId: string): Promise<void> {
    const game = this.games.get(gameId);
    if (!game || game.status !== "RUNNING") {
      return;
    }

    logger.info("Game reached time limit", { gameId });

    // Winner is player with higher progress (currentQuestionIndex)
    const playerList = Array.from(game.players.values());
    const player1 = playerList[0]!;
    const player2 = playerList[1]!;

    let winnerId: string | null = null;
    if (player1.currentQuestionIndex > player2.currentQuestionIndex) {
      winnerId = player1.user.id;
    } else if (player2.currentQuestionIndex > player1.currentQuestionIndex) {
      winnerId = player2.user.id;
    }

    await this.completeGame(game, winnerId, "TIME_LIMIT");
  }
}

export const gameService = new GameService();
