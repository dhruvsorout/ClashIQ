import WebSocket, { WebSocketServer } from "ws";

import { db } from "@ClashIQ/db";

import { authenticateWebSocket } from "./middleware/auth.middleware";

export type User = {
    id: string;
    name: string;
    ws: WebSocket;
}

const wss = new WebSocketServer({port: 8080});

const onlineUsers: Map<string, User> = new Map();

wss.on("connection", async (ws, req) => {
    const userId = authenticateWebSocket(req);

    if(!userId){
        ws.close();
        return;
    }

    const user = await db.user.findFirst({
        where: {
            id: userId,
        }
    })

    if (!user) {
        ws.close();
        return;
    }

    onlineUsers.set(userId, {
        name: user.username,
        ws,
        id: user.id,
    });

    wss.clients.forEach((ws) => {
        ws.send(
            JSON.stringify({
                type: "ONLINE_USERS",
                payload: {
                    users: Array.from(onlineUsers),
                },
            }),
        );
    });

    ws.on("message", (event) => {
        const parsedData = JSON.parse(event.toString());

        if(parsedData.type === "JOIN"){

        }
    })
})