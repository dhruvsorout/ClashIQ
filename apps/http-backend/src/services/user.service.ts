import { db } from "@ClashIQ/db";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

export type PublicUser = {
  id: string;
  email: string;
  username: string;
  rating: number | null;
};

const userSelect = {
  id: true,
  email: true,
  username: true,
  rating: { select: { rating: true } },
} as const;

const toPublicUser = (user: {
  id: string;
  email: string;
  username: string;
  rating: { rating: number } | null;
}): PublicUser => ({
  id: user.id,
  email: user.email,
  username: user.username,
  rating: user.rating?.rating ?? null,
});

export const getUserById = async (id: string): Promise<PublicUser> => {
  const user = await db.user.findUnique({
    where: { id },
    select: userSelect,
  });

  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND);
  }

  return toPublicUser(user);
};

export const updateUserProfile = async (
  requestingUserId: string,
  targetUserId: string,
  data: { username: string }
): Promise<PublicUser> => {
  if (requestingUserId !== targetUserId) {
    throw new AppError("You are not authorized to update this profile.", StatusCodes.FORBIDDEN);
  }

  // Check if username is already taken by someone else
  const existingUser = await db.user.findUnique({
    where: { username: data.username },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== requestingUserId) {
    throw new AppError("Username is already taken.", StatusCodes.CONFLICT);
  }

  const updated = await db.user.update({
    where: { id: requestingUserId },
    data: { username: data.username },
    select: userSelect,
  });

  return toPublicUser(updated);
};

export const searchUsers = async (
  query: string,
  requestingUserId: string
): Promise<PublicUser[]> => {
  const users = await db.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
      NOT: { id: requestingUserId }, // exclude self
    },
    select: userSelect,
    take: 20,
  });

  return users.map(toPublicUser);
};
