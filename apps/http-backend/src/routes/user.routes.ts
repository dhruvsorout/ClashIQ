import { Router } from "express";
import {
  getMe,
  getUserProfile,
  updateMe,
  search,
  myStats,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema, searchQuerySchema, userIdParamSchema } from "../schemas/user.schema.js";

export const userRouter: Router = Router();

// All user routes are protected
userRouter.use(authMiddleware);

userRouter.get("/me", getMe);
userRouter.patch("/me", validate(updateProfileSchema), updateMe);
userRouter.get("/me/stats", myStats);
userRouter.get("/search", validate(searchQuerySchema, "query"), search);
userRouter.get("/:id", validate(userIdParamSchema, "params"), getUserProfile);
