import jwt, { JwtPayload } from "jsonwebtoken";
import type { IncomingMessage } from "http";

import { config } from "@ClashIQ/config";

const JWT_SECRET = config.jwtSecret;

export const authenticateWebSocket = (req: IncomingMessage): string | null => {
    const url = req.url;
    if(!url){
        return null;
    }

    const queryParams = new URLSearchParams(url.split('?')[1]);

    const token = queryParams.get('token');
    if(!token){
        return null;
    }

    try{
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

        if(typeof decoded === "string" || !decoded.userId){
            return null;
        }

        return decoded.userId;
    }catch{
        return null;
    }
};