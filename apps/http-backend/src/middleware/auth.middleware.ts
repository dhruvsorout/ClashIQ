import { config } from "@ClashIQ/config";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = config.jwtSecret;

export const authMiddleware = async(req: Request, res: Response, next: NextFunction) => {
    try{
        const token = req.headers.authorization;

        if(!token){
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Invalid token",
            })
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if (typeof decoded === "string" || !decoded.userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                message: "Invalid token",
            });
        }

        req.userId = decoded.userId;
        next();
    } catch(error){
        console.error(error);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: "Something went wrong",
            })
    }
}