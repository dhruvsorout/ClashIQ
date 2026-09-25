import { NextFunction, Request, Response } from "express";
import { getPendingChallenges } from "../services/challenge.service.js";
import { sendSuccess } from "../utils/response.js";

export const listPendingChallenges = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = await getPendingChallenges(req.userId);
    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};
