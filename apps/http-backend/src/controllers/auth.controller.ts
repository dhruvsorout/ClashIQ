import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { registerUser, loginUser, getAuthenticatedUser } from "../services/auth.service.js";
import { sendSuccess } from "../utils/response.js";

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const user = await registerUser(email, password);
    sendSuccess(res, { user }, StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await loginUser(email, password);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await getAuthenticatedUser(req.userId);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
};
