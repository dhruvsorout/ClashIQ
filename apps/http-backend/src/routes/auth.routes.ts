import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { loginSchema, registerSchema, zodErrorMessage } from "@ClashIQ/common";
import { db } from "@ClashIQ/db";
import { config } from "@ClashIQ/config";

import { authMiddleware } from "../middleware/auth.middleware.js";

export const authRouter: Router = Router();

const JWT_SECRET = config.jwtSecret;


authRouter.post("/register", async (req, res) => {
    // email, password
    const { success, data, error } = registerSchema.safeParse(req.body);

    if(!success){
        return res  
                .status(StatusCodes.BAD_REQUEST)
                .json({
                    message: zodErrorMessage({ error })
                });
    }

    const {email, password} = data;

    const existingUser = await db.user.findUnique({
        where: {
            email,
        }
    })

    if(existingUser){
        return res  
                .status(StatusCodes.CONFLICT)
                .json({
                    message: "User already exists"
                })
    }

    const username = email.split("@")[0]!;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
        data: {
            email,
            password: hashedPassword,
            username
        }
    });

    return res     
            .status(StatusCodes.CREATED)
            .json({
                message: "Registeration successfull",
                email: user.email,
                username: user.username
            })
});

authRouter.post("/login", async(req, res) => {
    const { success, data, error } = loginSchema.safeParse(req.body);

    if(!success){
        return res  
                .status(StatusCodes.BAD_REQUEST)
                .json({
                    message: zodErrorMessage({ error })
                });
    }

    const {email, password} = data;

    const existingUser = await db.user.findUnique({
        where: {
            email,
        }
    })

    if(!existingUser){
        return res  
                .status(StatusCodes.UNAUTHORIZED)
                .json({
                    message: "Invalid credentials"
                })
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if(!isPasswordValid){
        return res  
                .status(StatusCodes.UNAUTHORIZED)
                .json({
                    message: "Invalid credentials"
                })
    }

    const token = jwt.sign({
        userId: existingUser.id
    },  JWT_SECRET);

    return res
            .status(StatusCodes.OK)
            .json({
                message: "Login successfull",
                token
            })
})

authRouter.post("/me", authMiddleware, async(req, res) => {
    try{
        const userId = req.userId;

        const user = await db.user.findFirst({
            where: {
                id: userId,
            },
            omit: {
                password: true
            },
            include: {
                rating: true,
                gameMember: {
                    include: {
                        game: true,
                    }
                }
            }
        });

        if(!user){
            return res  
                    .status(StatusCodes.UNAUTHORIZED)
                    .json({
                        message: "Invalid credentials"
                    })
        }

        return res  
                .status(StatusCodes.OK)
                .json({
                    message: "User found",
                    email: user.email,
                    username: user.username
                })
    }catch(e){
        console.error(e);

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong"
        })
    }
})