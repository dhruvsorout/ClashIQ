import { config } from "@ClashIQ/config";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = config.jwtSecret;

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Authentication required. Provide a Bearer token.",
    });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (typeof decoded === "string" || !decoded.userId) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token payload.",
      });
      return;
    }

    req.userId = decoded.userId as string;
    next();
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
      return;
    }

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" ||
        error.name === "NotBeforeError" ||
        error.name === "SyntaxError")
    ) {
      res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Invalid token.",
      });
      return;
    }

    console.error("[authMiddleware] Unexpected error:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
