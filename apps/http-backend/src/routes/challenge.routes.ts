import { Router } from "express";
import { listPendingChallenges } from "../controllers/challenge.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

export const challengeRouter: Router = Router();

// Protected endpoint to retrieve persistent pending challenges
challengeRouter.use(authMiddleware);

challengeRouter.get("/pending", listPendingChallenges);
