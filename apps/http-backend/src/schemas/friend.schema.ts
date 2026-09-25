import { z } from "zod";

export const friendUserIdParamSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
