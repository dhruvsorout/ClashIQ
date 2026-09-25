import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "@ClashIQ/db";
import { config } from "@ClashIQ/config";
import { AppError } from "../utils/AppError.js";
import { StatusCodes } from "http-status-codes";

const JWT_SECRET = config.jwtSecret;
const SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = "7d";

export type SafeUser = {
  id: string;
  email: string;
  username: string;
};

export const registerUser = async (email: string, password: string): Promise<SafeUser> => {
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError("Email is already registered.", StatusCodes.CONFLICT);
  }

  // Derive a base username from the email local part and sanitize
  const baseUsername = email.split("@")[0]!.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 25);

  // Ensure username uniqueness by appending a random suffix if needed
  let username = baseUsername;
  const existingUsername = await db.user.findUnique({ where: { username } });
  if (existingUsername) {
    username = `${baseUsername}_${Math.floor(Math.random() * 9000 + 1000)}`;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await db.user.create({
    data: { email, password: hashedPassword, username },
    select: { id: true, email: true, username: true },
  });

  return user;
};

export const loginUser = async (
  email: string,
  password: string
): Promise<{ token: string; user: SafeUser }> => {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Use the same message for both "no user" and "wrong password" to prevent user enumeration
    throw new AppError("Invalid email or password.", StatusCodes.UNAUTHORIZED);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", StatusCodes.UNAUTHORIZED);
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: { id: user.id, email: user.email, username: user.username },
  };
};

export const getAuthenticatedUser = async (userId: string): Promise<SafeUser> => {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) {
    throw new AppError("User not found.", StatusCodes.NOT_FOUND);
  }

  return user;
};
