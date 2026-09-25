import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { StatusCodes } from "http-status-codes";

type ValidationTarget = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, target: ValidationTarget = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map(
        (issue) => `${issue.path.join(".") || "field"}: ${issue.message}`
      );
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        success: false,
        message: "Validation failed",
        errors,
      });
      return;
    }

    // Express 5: req.query is a getter and cannot be set directly.
    // For body and params we can safely assign the coerced/stripped data.
    // For query, we skip the assignment — validation has already passed.
    if (target !== "query") {
      (req as unknown as Record<string, unknown>)[target] = result.data;
    }

    next();
  };
