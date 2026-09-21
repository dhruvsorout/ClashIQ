import WebSocket, { WebSocketServer } from "ws";

import { db } from "@ClashIQ/db";

import { authenticateWebSocket } from "./middleware/auth.middleware";

import { Game, Question, User } from "./types"
import { generateQuestion } from "./utils/utils";

type ExtendedWs = WebSocket & { userId: string };

const wss = new WebSocketServer({port: 8080});

const onlineUsers: Map<string, User> = new Map();
const games: Map<string, Game> = new Map();
const currentQuestions: Map<string, number> = new Map();
const allQuestions: Map<string, Question[]> = new Map();

wss.on("connection", async (ws: ExtendedWs, req) => {
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

    ws.userId = userId;

    onlineUsers.set(userId, {
        name: user.username,
        ws,
        id: user.id,
    });

    wss.clients.forEach((wsAll) => {
        wsAll.send(
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

        if(parsedData.type === "PLAY_GAME"){
            const {  } = parsedData.payload;

            let runningGame: Game | null = null;

            for(const [gameId, game] of games.entries()){
                if(game.status === "SEARCHING_FOR_PLAYER"){
                    runningGame = game;
                    break;
                }
            }

            if(!runningGame){
                const gameId = crypto.randomUUID();

                games.set(gameId, {
                    id: gameId,
                    members: [
                        {
                            id: user.id,
                            name: user.username,
                            ws,
                         },
                    ],
                    adminId: user.id,
                    status: "SEARCHING_FOR_PLAYER",
                    questions: [],
                    answers: [],
                });

                wss.clients.forEach((wsAll) => {
                    if(wsAll === ws) return;
                    wsAll.send(
                            JSON.stringify({
                                type: "GAME_REQUEST",
                                payload: {
                                    gameId,
                                }
                            }),
                    );
                });

                return;
            }

            const currentGameFetched = games.get(runningGame.id)!;

            currentGameFetched.members.push({
                id: user.id,
                name: user.username,
                ws
            });

            currentGameFetched.questions = generateQuestion();

            allQuestions.set(runningGame.id, currentGameFetched.questions);

            currentGameFetched.status = "RUNNING";

            games.set(currentGameFetched.id, currentGameFetched); 
            
            const firstQuestion = currentGameFetched.questions[0];

            const key = `game: ${currentGameFetched.id}-user:${user.id}-q:${firstQuestion.id}`;

            currentQuestions.set(key, 0);

            currentGameFetched.members.forEach((mem) => {
                mem.ws.send(
                JSON.stringify({
                    type: "QUESTION",
                    payload: {
                        gameId: runningGame.id,
                        question: firstQuestion,
                    },
                }),
            );
            });
        }

        if(parsedData.type === "SUBMIT_ANSWER"){
            const { gameId, questionId, answer } = parsedData.payload;

            const existingGame = games.get(gameId);

            if(!existingGame){
                ws.close();
                return;
            }

            const existingQuestion = existingGame.questions.find((qs) => qs.id === questionId);

            if(!existingQuestion){
                ws.close();
                return;
            }

            const filteredAnswers = existingGame.answers.filter((exGm) => {
                exGm.questionId !== questionId;
            });

            filteredAnswers.push({
                id: crypto.randomUUID(),
                answer,
                questionId,
            });

            if(answer !== existingQuestion.answer){
                return;
            }

            const key = `game: ${existingGame.id}-user:${user.id}-q:${existingQuestion.id}`;
            const currentQuestionIndex = currentQuestions.get(key)!;
            const storedQuestions = allQuestions.get(existingGame.id)!;

            const nextQuestion = storedQuestions[currentQuestionIndex + 1]; 

            currentQuestions.set(key, currentQuestionIndex + 1);

            ws.send(
                JSON.stringify({
                    type: "QUESTION",
                    payload: {
                        gameId: existingGame.id,
                        question: nextQuestion,
                    },
                }),
            )
        }
    });
})