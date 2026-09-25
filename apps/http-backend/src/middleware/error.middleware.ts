import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AppError } from "../utils/AppError.js";

// Dynamically typed to avoid coupling to prisma internals
interface PrismaKnownError extends Error {
  code: string;
  meta?: Record<string, unknown>;
}

const isPrismaKnownError = (err: unknown): err is PrismaKnownError =>
  err instanceof Error && "code" in err && typeof (err as PrismaKnownError).code === "string";

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma errors
  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      const target = err.meta?.["target"];
      const field = Array.isArray(target) ? target.join(", ") : "field";
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `A record with this ${field} already exists.`,
      });
      return;
    }

    if (err.code === "P2025") {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Resource not found.",
      });
      return;
    }

    console.error("[Prisma error]", err.code, err.message);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Database error.",
    });
    return;
  }

  // Unknown errors — never expose internals
  console.error("[Unhandled error]", err);
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
};
