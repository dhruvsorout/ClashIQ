import { NextFunction, Request, Response } from "express";
import { getGameHistory, getGameById } from "../services/game.service.js";
import { sendSuccess } from "../utils/response.js";

export const history = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const games = await getGameHistory(req.userId);
    sendSuccess(res, { games });
  } catch (error) {
    next(error);
  }
};

export const gameDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { gameId } = req.params as { gameId: string };
    const game = await getGameById(gameId, req.userId);
    sendSuccess(res, { game });
  } catch (error) {
    next(error);
  }
};
