import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(100),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
});
