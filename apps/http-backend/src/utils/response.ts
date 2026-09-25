import { Response } from "express";
import { StatusCodes } from "http-status-codes";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = StatusCodes.OK
): Response => {
  return res.status(statusCode).json({ success: true, data });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
): Response => {
  return res.status(statusCode).json({ success: false, message });
};

export const sendValidationError = (
  res: Response,
  errors: string[]
): Response => {
  return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
    success: false,
    message: "Validation failed",
    errors,
  });
};
