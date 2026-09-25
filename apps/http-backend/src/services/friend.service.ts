import { db } from "@ClashIQ/db";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

type FriendUserInfo = {
  id: string;
  username: string;
  email: string;
};

type FriendRecord = {
  id: string;
  friendStatus: "ACCEPTED" | "REJECTED" | "PENDING";
  sender: FriendUserInfo;
  receiver: FriendUserInfo;
};

const friendSelect = {
  id: true,
  friendStatus: true,
  sender: { select: { id: true, username: true, email: true } },
  receiver: { select: { id: true, username: true, email: true } },
} as const;

export const sendFriendRequest = async (
  senderId: string,
  receiverId: string
): Promise<FriendRecord> => {
  if (senderId === receiverId) {
    throw new AppError("You cannot send a friend request to yourself.", StatusCodes.BAD_REQUEST);
  }

  const receiver = await db.user.findUnique({ where: { id: receiverId }, select: { id: true } });
  if (!receiver) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND);
  }

  const existing = await db.friends.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (existing) {
    if (existing.friendStatus === "PENDING") {
      throw new AppError("A friend request is already pending.", StatusCodes.CONFLICT);
    }
    if (existing.friendStatus === "ACCEPTED") {
      throw new AppError("You are already friends.", StatusCodes.CONFLICT);
    }
    // REJECTED — allow re-requesting
    const updated = await db.friends.update({
      where: { id: existing.id },
      data: { senderId, receiverId, friendStatus: "PENDING" },
      select: friendSelect,
    });
    return updated as FriendRecord;
  }

  const request = await db.friends.create({
    data: { senderId, receiverId, friendStatus: "PENDING" },
    select: friendSelect,
  });

  return request as FriendRecord;
};

export const acceptFriendRequest = async (
  requestingUserId: string,
  senderId: string
): Promise<FriendRecord> => {
  const request = await db.friends.findFirst({
    where: { senderId, receiverId: requestingUserId, friendStatus: "PENDING" },
    select: friendSelect,
  });

  if (!request) {
    throw new AppError("Friend request not found.", StatusCodes.NOT_FOUND);
  }

  if (request.receiver.id !== requestingUserId) {
    throw new AppError("You are not authorized to accept this request.", StatusCodes.FORBIDDEN);
  }

  const updated = await db.friends.update({
    where: { id: request.id },
    data: { friendStatus: "ACCEPTED" },
    select: friendSelect,
  });

  return updated as FriendRecord;
};

export const rejectFriendRequest = async (
  requestingUserId: string,
  senderId: string
): Promise<FriendRecord> => {
  const request = await db.friends.findFirst({
    where: { senderId, receiverId: requestingUserId, friendStatus: "PENDING" },
    select: friendSelect,
  });

  if (!request) {
    throw new AppError("Friend request not found.", StatusCodes.NOT_FOUND);
  }

  if (request.receiver.id !== requestingUserId) {
    throw new AppError("You are not authorized to reject this request.", StatusCodes.FORBIDDEN);
  }

  const updated = await db.friends.update({
    where: { id: request.id },
    data: { friendStatus: "REJECTED" },
    select: friendSelect,
  });

  return updated as FriendRecord;
};

export const removeFriend = async (
  requestingUserId: string,
  otherUserId: string
): Promise<void> => {
  const friendship = await db.friends.findFirst({
    where: {
      OR: [
        { senderId: requestingUserId, receiverId: otherUserId, friendStatus: "ACCEPTED" },
        { senderId: otherUserId, receiverId: requestingUserId, friendStatus: "ACCEPTED" },
      ],
    },
  });

  if (!friendship) {
    throw new AppError("Friendship not found.", StatusCodes.NOT_FOUND);
  }

  await db.friends.delete({ where: { id: friendship.id } });
};

export const getFriends = async (
  userId: string
): Promise<{ friendshipId: string; friend: FriendUserInfo }[]> => {
  const friendships = await db.friends.findMany({
    where: {
      OR: [
        { senderId: userId, friendStatus: "ACCEPTED" },
        { receiverId: userId, friendStatus: "ACCEPTED" },
      ],
    },
    select: friendSelect,
  });

  return friendships.map((f) => {
    const friend = f.sender.id === userId ? f.receiver : f.sender;
    return { friendshipId: f.id, friend };
  });
};

export const getPendingRequests = async (userId: string): Promise<FriendRecord[]> => {
  const requests = await db.friends.findMany({
    where: { receiverId: userId, friendStatus: "PENDING" },
    select: friendSelect,
  });

  return requests as FriendRecord[];
};
