import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} from "../services/friend.service.js";
import { sendSuccess } from "../utils/response.js";

export const requestFriend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };
    const request = await sendFriendRequest(req.userId, userId);
    sendSuccess(res, { request }, StatusCodes.CREATED);
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };
    const friendship = await acceptFriendRequest(req.userId, userId);
    sendSuccess(res, { friendship });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };
    const friendship = await rejectFriendRequest(req.userId, userId);
    sendSuccess(res, { friendship });
  } catch (error) {
    next(error);
  }
};

export const deleteFriend = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params as { userId: string };
    await removeFriend(req.userId, userId);
    sendSuccess(res, { message: "Friend removed successfully." });
  } catch (error) {
    next(error);
  }
};

export const listFriends = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const friends = await getFriends(req.userId);
    sendSuccess(res, { friends });
  } catch (error) {
    next(error);
  }
};

export const listRequests = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await getPendingRequests(req.userId);
    sendSuccess(res, { requests });
  } catch (error) {
    next(error);
  }
};
