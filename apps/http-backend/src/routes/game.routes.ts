import { Router } from "express";
import { history, gameDetail } from "../controllers/game.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { gameIdParamSchema } from "../schemas/game.schema.js";

export const gameRouter: Router = Router();

// All game routes are protected
gameRouter.use(authMiddleware);

gameRouter.get("/history", history);
gameRouter.get("/:gameId", validate(gameIdParamSchema, "params"), gameDetail);
