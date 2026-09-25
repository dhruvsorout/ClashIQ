import { Router } from "express";
import {
  requestFriend,
  acceptRequest,
  rejectRequest,
  deleteFriend,
  listFriends,
  listRequests,
} from "../controllers/friend.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { friendUserIdParamSchema } from "../schemas/friend.schema.js";

export const friendRouter: Router = Router();

// All friend routes are protected
friendRouter.use(authMiddleware);

const validateUserId = validate(friendUserIdParamSchema, "params");

friendRouter.get("/", listFriends);
friendRouter.get("/requests", listRequests);
friendRouter.post("/:userId/request", validateUserId, requestFriend);
friendRouter.post("/:userId/accept", validateUserId, acceptRequest);
friendRouter.post("/:userId/reject", validateUserId, rejectRequest);
friendRouter.delete("/:userId", validateUserId, deleteFriend);
