import { db } from "@ClashIQ/db";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

type GameMemberResult = "WON" | "LOSS";
type GameStatusType = "RUNNING" | "SEARCHING_FOR_PLAYER" | "OVER";
type QuestionSignType = "PLUS" | "MINUS" | "DIVIDE" | "MULTIPLICATION";

type GameHistoryItem = {
  gameId: string;
  status: GameStatusType;
  result: GameMemberResult | null;
  timeLimit: number;
  startedAt: Date;
  endedAt: Date;
  opponents: {
    userId: string;
    username: string;
    result: GameMemberResult;
  }[];
};

type GameDetail = {
  id: string;
  status: GameStatusType;
  timeLimit: number;
  startedAt: Date;
  endedAt: Date;
  gameMember: {
    id: string;
    status: GameMemberResult;
    user: { id: string; username: string };
  }[];
  questions: {
    id: string;
    operation1: number;
    operation2: number;
    sign: QuestionSignType;
    systemAnswer: number;
  }[];
  answers: {
    id: string;
    answer: number;
    questionId: string;
    userId: string;
    user: { id: string; username: string };
  }[];
};

type UserStats = {
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  winRate: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  rating: number;
};

export const getGameHistory = async (userId: string): Promise<GameHistoryItem[]> => {
  const gameMemberships = await db.gameMember.findMany({
    where: { userId },
    select: {
      id: true,
      status: true,
      game: {
        select: {
          id: true,
          status: true,
          timeLimit: true,
          startedAt: true,
          endedAt: true,
          gameMember: {
            select: {
              id: true,
              status: true,
              user: { select: { id: true, username: true } },
            },
          },
        },
      },
    },
    orderBy: { game: { startedAt: "desc" } },
  });

  return gameMemberships.map((membership) => {
    const game = membership.game;
    const myMember = game.gameMember.find((m) => m.user.id === userId);
    const opponents = game.gameMember.filter((m) => m.user.id !== userId);

    return {
      gameId: game.id,
      status: game.status as GameStatusType,
      result: (myMember?.status ?? null) as GameMemberResult | null,
      timeLimit: game.timeLimit,
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      opponents: opponents.map((o) => ({
        userId: o.user.id,
        username: o.user.username,
        result: o.status as GameMemberResult,
      })),
    };
  });
};

export const getGameById = async (
  gameId: string,
  requestingUserId: string
): Promise<GameDetail> => {
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      status: true,
      timeLimit: true,
      startedAt: true,
      endedAt: true,
      gameMember: {
        select: {
          id: true,
          status: true,
          user: { select: { id: true, username: true } },
        },
      },
      questions: {
        select: {
          id: true,
          operation1: true,
          operation2: true,
          sign: true,
          systemAnswer: true,
        },
      },
      answers: {
        select: {
          id: true,
          answer: true,
          questionId: true,
          userId: true,
          user: { select: { id: true, username: true } },
        },
      },
    },
  });

  if (!game) {
    throw new AppError("Game not found.", StatusCodes.NOT_FOUND);
  }

  const isParticipant = game.gameMember.some((m) => m.user.id === requestingUserId);
  if (!isParticipant) {
    throw new AppError("You are not authorized to view this game.", StatusCodes.FORBIDDEN);
  }

  return {
    id: game.id,
    status: game.status as GameStatusType,
    timeLimit: game.timeLimit,
    startedAt: game.startedAt,
    endedAt: game.endedAt,
    gameMember: game.gameMember.map((m) => ({
      id: m.id,
      status: m.status as GameMemberResult,
      user: m.user,
    })),
    questions: game.questions.map((q) => ({
      id: q.id,
      operation1: q.operation1,
      operation2: q.operation2,
      sign: q.sign as QuestionSignType,
      systemAnswer: q.systemAnswer,
    })),
    answers: game.answers.map((a) => ({
      id: a.id,
      answer: a.answer,
      questionId: a.questionId,
      userId: a.userId,
      user: a.user,
    })),
  };
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const [memberships, answers, rating] = await Promise.all([
    db.gameMember.findMany({
      where: { userId, game: { status: "OVER" } },
      select: { status: true },
    }),
    db.questionAnswer.findMany({
      where: { userId },
      select: { answer: true, question: { select: { systemAnswer: true } } },
    }),
    db.userRating.findUnique({
      where: { userId },
      select: { rating: true },
    }),
  ]);

  const totalGames = memberships.length;
  const gamesWon = memberships.filter((m) => m.status === "WON").length;
  const gamesLost = memberships.filter((m) => m.status === "LOSS").length;
  const winRate = totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const totalAnswers = answers.length;
  const correctAnswers = answers.filter((a) => a.answer === a.question.systemAnswer).length;
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

  return {
    totalGames,
    gamesWon,
    gamesLost,
    winRate,
    totalAnswers,
    correctAnswers,
    accuracy,
    rating: rating?.rating ?? 1000,
  };
};
