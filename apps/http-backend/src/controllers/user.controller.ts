import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getUserById, updateUserProfile, searchUsers } from "../services/user.service.js";
import { getUserStats } from "../services/game.service.js";
import { sendSuccess } from "../utils/response.js";

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getUserById(req.userId);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const user = await getUserById(id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.body as { username: string };
    const user = await updateUserProfile(req.userId, req.userId, { username });
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};

export const search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query as { q: string };
    const users = await searchUsers(q, req.userId);
    sendSuccess(res, { users });
  } catch (error) {
    next(error);
  }
};

export const myStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stats = await getUserStats(req.userId);
    sendSuccess(res, { stats });
  } catch (error) {
    next(error);
  }
};
