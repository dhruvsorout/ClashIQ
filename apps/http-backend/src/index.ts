import express from "express";
import cors from "cors";

import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { friendRouter } from "./routes/friend.routes.js";
import { gameRouter } from "./routes/game.routes.js";
import { globalErrorHandler } from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/friends", friendRouter);
app.use("/api/v1/games", gameRouter);

// 404 handler for unknown routes
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

// Centralized error handler (must be last)
app.use(globalErrorHandler);

app.listen(4000, () => {
  console.log("HTTP backend running on http://localhost:4000");
});