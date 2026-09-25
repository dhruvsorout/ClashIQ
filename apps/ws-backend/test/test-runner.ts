import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import WebSocket from "ws";
import { config } from "@ClashIQ/config";
import { db } from "@ClashIQ/db";
import { GameWebSocketServer } from "../src/server/websocket.server.js";

const TEST_PORT = 8089;
const WS_URL = `ws://localhost:${TEST_PORT}`;

// Test Users from DB
const USER_1 = {
  id: "c4487e22-4527-481c-ba2d-fedbb3f5c71a",
  username: "test1",
};

const USER_2 = {
  id: "1a09d9ae-bb06-429f-85ba-f17c68fe5721",
  username: "dhruvsorout1526",
};

const USER_3 = {
  id: "a5f567f6-cc07-4967-96fb-33664b53217c",
  username: "omsorout",
};

function createToken(userId: string): string {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: "1h" });
}

interface TestMessage {
  type: string;
  payload: Record<string, any>;
}

function connectClient(token?: string): Promise<{ ws: WebSocket; messages: TestMessage[] }> {
  return new Promise((resolve, reject) => {
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;
    const ws = new WebSocket(url);
    const messages: TestMessage[] = [];

    ws.on("message", (data) => {
      try {
        messages.push(JSON.parse(data.toString()));
      } catch {
        // raw string
      }
    });

    ws.on("open", () => resolve({ ws, messages }));
    ws.on("error", (err) => reject(err));
  });
}

function waitForMessage(
  messages: TestMessage[],
  predicate: (msg: TestMessage) => boolean,
  timeoutMs = 5000
): Promise<TestMessage> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const found = messages.find(predicate);
      if (found) {
        clearInterval(interval);
        resolve(found);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for message matching predicate after ${timeoutMs}ms. Received: ${JSON.stringify(messages)}`));
      }
    }, 50);
  });
}

async function runTests() {
  console.log("=== STARTING CLASHIQ PHASE 2 WEBSOCKET TEST SUITE ===");

  const server = new GameWebSocketServer(TEST_PORT);
  server.start();
  await new Promise((r) => setTimeout(r, 500)); // wait for server to listen

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition: boolean, testName: string, details?: any) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      testsPassed++;
    } else {
      console.error(`[FAIL] ${testName}`, details ?? "");
      testsFailed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: AUTHENTICATION & CONNECTION LIFECYCLE
    // -------------------------------------------------------------
    console.log("\n--- Group 1: Authentication & Connection Lifecycle ---");

    // Test 1: Missing JWT rejected
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(WS_URL);
      ws.on("close", (code) => {
        assert(code === 4001, "Test 1: Missing token is rejected with code 4001");
        resolve();
      });
    });

    // Test 2: Invalid JWT rejected
    await new Promise<void>((resolve) => {
      const ws = new WebSocket(`${WS_URL}?token=invalid.token.here`);
      ws.on("close", (code) => {
        assert(code === 4001, "Test 2: Invalid JWT is rejected with code 4001");
        resolve();
      });
    });

    // Test 3: Non-existent user rejected
    await new Promise<void>((resolve) => {
      const fakeToken = jwt.sign({ userId: "00000000-0000-0000-0000-000000000000" }, config.jwtSecret);
      const ws = new WebSocket(`${WS_URL}?token=${fakeToken}`);
      ws.on("close", (code) => {
        assert(code === 4001, "Test 3: Non-existent user is rejected with code 4001");
        resolve();
      });
    });

    // Test 4: Valid JWT connects successfully
    const token1 = createToken(USER_1.id);
    const client1 = await connectClient(token1);
    assert(client1.ws.readyState === WebSocket.OPEN, "Test 4: Valid JWT connects successfully");

    // Test 5: Online users event broadcast
    const onlineMsg1 = await waitForMessage(client1.messages, (m) => m.type === "ONLINE_USERS");
    assert(
      Array.isArray(onlineMsg1.payload.users) && onlineMsg1.payload.users.some((u: any) => u.id === USER_1.id),
      "Test 5: Online users event received containing user1",
      onlineMsg1.payload
    );

    // Test 6: Second user connects and both receive updated online users
    const token2 = createToken(USER_2.id);
    const client2 = await connectClient(token2);
    const onlineMsg2 = await waitForMessage(client2.messages, (m) => m.type === "ONLINE_USERS");
    assert(
      onlineMsg2.payload.users.some((u: any) => u.id === USER_1.id) &&
        onlineMsg2.payload.users.some((u: any) => u.id === USER_2.id),
      "Test 6: Second user connects and online users list contains both players"
    );

    // -------------------------------------------------------------
    // GROUP 2: MATCHMAKING
    // -------------------------------------------------------------
    console.log("\n--- Group 2: Matchmaking ---");

    // Test 7: Player 1 initiates PLAY_GAME -> gets GAME_REQUEST (waiting)
    client1.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    const gameReqMsg = await waitForMessage(client1.messages, (m) => m.type === "GAME_REQUEST");
    assert(Boolean(gameReqMsg.payload.gameId), "Test 7: Player 1 receives GAME_REQUEST with gameId");

    const gameId = gameReqMsg.payload.gameId;

    // Test 8: Player 2 initiates PLAY_GAME -> Match found!
    client2.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));

    // Test 9 & 10: Both players receive GAME_STARTED
    const gameStarted1 = await waitForMessage(client1.messages, (m) => m.type === "GAME_STARTED");
    const gameStarted2 = await waitForMessage(client2.messages, (m) => m.type === "GAME_STARTED");

    assert(
      gameStarted1.payload.gameId === gameId && gameStarted1.payload.opponent.id === USER_2.id,
      "Test 9: Player 1 receives GAME_STARTED with Player 2 as opponent"
    );
    assert(
      gameStarted2.payload.gameId === gameId && gameStarted2.payload.opponent.id === USER_1.id,
      "Test 10: Player 2 receives GAME_STARTED with Player 1 as opponent"
    );

    // Test 11 & 12: Both receive initial QUESTION event without answers
    const qMsg1 = await waitForMessage(client1.messages, (m) => m.type === "QUESTION");
    const qMsg2 = await waitForMessage(client2.messages, (m) => m.type === "QUESTION");

    assert(
      qMsg1.payload.questionNumber === 1 && qMsg1.payload.question.id !== undefined,
      "Test 11: Player 1 receives first question"
    );
    assert(
      !("systemAnswer" in qMsg1.payload.question) && !("answer" in qMsg1.payload.question),
      "Test 12: Question does NOT leak systemAnswer or answer to client!"
    );

    // Test 13: Third player requests PLAY_GAME -> Placed in new queue, does not disrupt current game
    const token3 = createToken(USER_3.id);
    const client3 = await connectClient(token3);
    client3.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    const gameReq3 = await waitForMessage(client3.messages, (m) => m.type === "GAME_REQUEST");
    assert(
      gameReq3.payload.gameId !== gameId,
      "Test 13: Third player is queued separately and does not corrupt running game"
    );
    // Cancel matchmaking for player 3
    client3.ws.send(JSON.stringify({ type: "CANCEL_MATCHMAKING", payload: {} }));
    await new Promise((r) => setTimeout(r, 100));

    // -------------------------------------------------------------
    // GROUP 3: ANSWER SUBMISSION & PER-PLAYER PROGRESS
    // -------------------------------------------------------------
    console.log("\n--- Group 3: Answer Submission & Per-Player Progress ---");

    const currentQ1 = qMsg1.payload.question;

    // Test 14: Wrong answer does not advance question
    client1.ws.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        payload: {
          gameId,
          questionId: currentQ1.id,
          answer: -999999, // guaranteed wrong
        },
      })
    );

    const wrongResult = await waitForMessage(
      client1.messages,
      (m) => m.type === "ANSWER_RESULT" && m.payload.questionId === currentQ1.id
    );
    assert(wrongResult.payload.correct === false, "Test 14: Wrong answer returns ANSWER_RESULT { correct: false }");

    // Test 15: Invalid question sequence rejected
    client1.ws.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        payload: {
          gameId,
          questionId: "00000000-0000-0000-0000-000000000000",
          answer: 42,
        },
      })
    );
    const errorSeq = await waitForMessage(client1.messages, (m) => m.type === "ERROR");
    assert(
      errorSeq.payload.code === "INVALID_QUESTION_SEQUENCE",
      "Test 15: Submitting for unknown/out-of-sequence questionId returns INVALID_QUESTION_SEQUENCE"
    );

    // Test 16: Unauthorized player cannot submit answer
    client3.ws.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        payload: {
          gameId,
          questionId: currentQ1.id,
          answer: 10,
        },
      })
    );
    const unauthorizedErr = await waitForMessage(client3.messages, (m) => m.type === "ERROR");
    assert(
      unauthorizedErr.payload.code === "UNAUTHORIZED_GAME_ACCESS",
      "Test 16: External player cannot submit answers to an ongoing game"
    );

    // -------------------------------------------------------------
    // GROUP 4: GAME COMPLETION & PERSISTENCE
    // -------------------------------------------------------------
    console.log("\n--- Group 4: Game Completion & Persistence ---");

    // Helper: calculate the correct answer from question operations
    function solveQuestion(q: { operation1: number; operation2: number; sign: string }): number {
      switch (q.sign) {
        case "PLUS":
          return q.operation1 + q.operation2;
        case "MINUS":
          return q.operation1 - q.operation2;
        case "MULTIPLICATION":
          return q.operation1 * q.operation2;
        case "DIVIDE":
          return q.operation1 / q.operation2;
        default:
          return 0;
      }
    }

    // Player 1 answers all 10 questions correctly
    let activeQuestion = currentQ1;
    for (let qNum = 1; qNum <= 10; qNum++) {
      const correctAnswer = solveQuestion(activeQuestion);
      client1.ws.send(
        JSON.stringify({
          type: "SUBMIT_ANSWER",
          payload: {
            gameId,
            questionId: activeQuestion.id,
            answer: correctAnswer,
          },
        })
      );

      // Wait for correct answer result
      await waitForMessage(
        client1.messages,
        (m) => m.type === "ANSWER_RESULT" && m.payload.questionId === activeQuestion.id && m.payload.correct === true
      );

      if (qNum < 10) {
        const nextQMsg = await waitForMessage(
          client1.messages,
          (m) => m.type === "QUESTION" && m.payload.questionNumber === qNum + 1
        );
        activeQuestion = nextQMsg.payload.question;
      }
    }

    // Test 17: Player 1 completes game and receives GAME_OVER as WINNER
    const gameOver1 = await waitForMessage(client1.messages, (m) => m.type === "GAME_OVER");
    assert(
      gameOver1.payload.winnerId === USER_1.id &&
        gameOver1.payload.userResult === "WON" &&
        gameOver1.payload.reason === "COMPLETED",
      "Test 17: Player 1 receives GAME_OVER with WON result and COMPLETED reason"
    );

    // Test 18: Player 2 receives GAME_OVER as LOSER
    const gameOver2 = await waitForMessage(client2.messages, (m) => m.type === "GAME_OVER");
    assert(
      gameOver2.payload.winnerId === USER_1.id && gameOver2.payload.userResult === "LOSS",
      "Test 18: Player 2 receives GAME_OVER with LOSS result"
    );

    // Test 19: Database persistence verification
    await new Promise((r) => setTimeout(r, 500)); // allow async DB transaction to settle
    const persistedGame = await db.game.findUnique({
      where: { id: gameId },
      include: {
        gameMember: true,
        questions: true,
        answers: true,
      },
    });

    assert(persistedGame !== null && persistedGame.status === "OVER", "Test 19: Game record persisted with status OVER");
    assert(persistedGame!.gameMember.length === 2, "Test 20: 2 GameMember records persisted");

    const winnerMember = persistedGame!.gameMember.find((m) => m.userId === USER_1.id);
    const loserMember = persistedGame!.gameMember.find((m) => m.userId === USER_2.id);
    assert(
      winnerMember?.status === "WON" && loserMember?.status === "LOSS",
      "Test 21: GameMember WON and LOSS statuses persisted correctly"
    );

    assert(persistedGame!.questions.length === 10, "Test 22: 10 Question records persisted in DB");
    assert(persistedGame!.answers.length >= 10, "Test 23: QuestionAnswer records persisted in DB");

    // Test 24: Ratings updated in DB
    const winnerRating = await db.userRating.findUnique({ where: { userId: USER_1.id } });
    const loserRating = await db.userRating.findUnique({ where: { userId: USER_2.id } });
    assert(
      winnerRating !== null && winnerRating.rating >= 1000,
      `Test 24: Winner rating updated (Rating: ${winnerRating?.rating})`
    );
    assert(
      loserRating !== null && loserRating.rating <= 1000,
      `Test 25: Loser rating updated (Rating: ${loserRating?.rating})`
    );

    // Clean up sockets
    client1.ws.close();
    client2.ws.close();
    client3.ws.close();
    await new Promise((r) => setTimeout(r, 300));

    // -------------------------------------------------------------
    // GROUP 5: DISCONNECT BEHAVIOR
    // -------------------------------------------------------------
    console.log("\n--- Group 5: Disconnect Behavior ---");

    // Test 26: Disconnect during matchmaking clears queue
    const cQueue = await connectClient(createToken(USER_1.id));
    cQueue.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    await waitForMessage(cQueue.messages, (m) => m.type === "GAME_REQUEST");
    cQueue.ws.close();
    await new Promise((r) => setTimeout(r, 300));

    // Connect user 2 and request match -> should NOT match with disconnected user 1
    const cNew = await connectClient(createToken(USER_2.id));
    cNew.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    const newReq = await waitForMessage(cNew.messages, (m) => m.type === "GAME_REQUEST");
    assert(
      Boolean(newReq.payload.gameId),
      "Test 26: Disconnected user in matchmaking does not produce stale ghost matches"
    );
    cNew.ws.close();
    await new Promise((r) => setTimeout(r, 300));

    // Test 27: Disconnect during RUNNING game forfeits and awards win to opponent
    const playerA = await connectClient(createToken(USER_1.id));
    const playerB = await connectClient(createToken(USER_2.id));

    playerA.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    await waitForMessage(playerA.messages, (m) => m.type === "GAME_REQUEST");

    playerB.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    const startA = await waitForMessage(playerA.messages, (m) => m.type === "GAME_STARTED");
    await waitForMessage(playerB.messages, (m) => m.type === "GAME_STARTED");

    const forfeitGameId = startA.payload.gameId;

    // Player A abruptly disconnects
    playerA.ws.close();

    // Player B should receive GAME_OVER with reason FORFEIT and userResult WON
    const forfeitGameOver = await waitForMessage(
      playerB.messages,
      (m) => m.type === "GAME_OVER" && m.payload.gameId === forfeitGameId
    );
    assert(
      forfeitGameOver.payload.reason === "FORFEIT" &&
        forfeitGameOver.payload.winnerId === USER_2.id &&
        forfeitGameOver.payload.userResult === "WON",
      "Test 27: Disconnecting player triggers FORFEIT and remaining player wins"
    );

    // Verify forfeit persisted in DB
    await new Promise((r) => setTimeout(r, 400));
    const persistedForfeit = await db.game.findUnique({
      where: { id: forfeitGameId },
      include: { gameMember: true },
    });
    assert(persistedForfeit !== null && persistedForfeit.status === "OVER", "Test 28: Forfeited game persisted as OVER");

    playerB.ws.close();

    // -------------------------------------------------------------
    // GROUP 6: MALFORMED MESSAGE & SCHEMA VALIDATION
    // -------------------------------------------------------------
    console.log("\n--- Group 6: Error Handling & Malformed Messages ---");

    const errClient = await connectClient(createToken(USER_1.id));

    // Test 29: Malformed JSON does not crash server
    errClient.ws.send("NOT_VALID_JSON{{{");
    const jsonErr = await waitForMessage(errClient.messages, (m) => m.type === "ERROR");
    assert(
      jsonErr.payload.code === "MALFORMED_JSON",
      "Test 29: Malformed JSON handled safely and returns MALFORMED_JSON error"
    );

    // Test 30: Invalid payload schema handled safely
    errClient.ws.send(
      JSON.stringify({
        type: "SUBMIT_ANSWER",
        payload: {
          gameId: "not-a-uuid",
          questionId: "not-a-uuid",
          answer: "not-a-number",
        },
      })
    );
    const schemaErr = await waitForMessage(
      errClient.messages,
      (m) => m.type === "ERROR" && m.payload.code === "INVALID_MESSAGE_PAYLOAD"
    );
    assert(
      schemaErr.payload.code === "INVALID_MESSAGE_PAYLOAD",
      "Test 30: Invalid payload handled safely and returns INVALID_MESSAGE_PAYLOAD error"
    );

    errClient.ws.close();

    // -------------------------------------------------------------
    // GROUP 7: FRIEND CHALLENGES (FULL LIFECYCLE & INTEGRATION)
    // -------------------------------------------------------------
    console.log("\n--- Group 7: Friend Challenges ---");

    // Setup DB state: USER_1 and USER_2 are friends; USER_3 is not friends with USER_1
    await db.friends.deleteMany({
      where: {
        OR: [
          { senderId: USER_1.id, receiverId: USER_2.id },
          { senderId: USER_2.id, receiverId: USER_1.id },
          { senderId: USER_1.id, receiverId: USER_3.id },
          { senderId: USER_3.id, receiverId: USER_1.id },
        ],
      },
    });

    await db.friends.create({
      data: {
        senderId: USER_1.id,
        receiverId: USER_2.id,
        friendStatus: "ACCEPTED",
      },
    });

    // Clean up test challenges
    await db.gameChallenge.deleteMany({
      where: {
        OR: [
          { challengerId: USER_1.id },
          { challengerId: USER_2.id },
          { challengerId: USER_3.id },
          { challengedId: USER_1.id },
          { challengedId: USER_2.id },
          { challengedId: USER_3.id },
        ],
      },
    });

    // Connect clients
    const friendClient1 = await connectClient(createToken(USER_1.id));
    const friendClient2 = await connectClient(createToken(USER_2.id));
    const nonFriendClient = await connectClient(createToken(USER_3.id));

    // Test 31: User cannot challenge themselves
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_1.id },
      })
    );
    const selfErr = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "ERROR" && m.payload.code === "CANNOT_CHALLENGE_SELF"
    );
    assert(
      selfErr.payload.code === "CANNOT_CHALLENGE_SELF",
      "Test 31: User cannot challenge themselves (CANNOT_CHALLENGE_SELF)"
    );

    // Test 32: User cannot challenge non-friend
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_3.id },
      })
    );
    const nonFriendErr = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "ERROR" && m.payload.code === "NOT_FRIENDS"
    );
    assert(
      nonFriendErr.payload.code === "NOT_FRIENDS",
      "Test 32: User cannot challenge non-friend (NOT_FRIENDS)"
    );

    // Test 33 & 34: Challenge an accepted friend; target receives real-time notification
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_2.id },
      })
    );

    const receivedChallenge = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "CHALLENGE_RECEIVED" && m.payload.challenger.id === USER_1.id
    );
    assert(
      Boolean(receivedChallenge.payload.challengeId),
      "Test 33: Target friend receives CHALLENGE_RECEIVED with challenger details"
    );

    const activeChallengeId = receivedChallenge.payload.challengeId;
    const challengeRecord = await db.gameChallenge.findUnique({
      where: { id: activeChallengeId },
    });
    assert(
      challengeRecord?.status === "PENDING" && challengeRecord.expiresAt > new Date(),
      "Test 34: Challenge is persisted in DB with status PENDING and expiresAt"
    );

    // Test 35: Duplicate pending challenge rejected
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_2.id },
      })
    );
    const dupErr = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "ERROR" && m.payload.code === "DUPLICATE_CHALLENGE"
    );
    assert(
      dupErr.payload.code === "DUPLICATE_CHALLENGE",
      "Test 35: Duplicate pending challenge between same players is rejected (DUPLICATE_CHALLENGE)"
    );

    // Test 36: Unauthorized user cannot accept someone else's challenge
    nonFriendClient.ws.send(
      JSON.stringify({
        type: "ACCEPT_CHALLENGE",
        payload: { challengeId: activeChallengeId },
      })
    );
    const unauthErr = await waitForMessage(
      nonFriendClient.messages,
      (m) => m.type === "ERROR" && m.payload.code === "UNAUTHORIZED_CHALLENGE_ACCEPT"
    );
    assert(
      unauthErr.payload.code === "UNAUTHORIZED_CHALLENGE_ACCEPT",
      "Test 36: Unauthorized user cannot accept someone else's challenge (UNAUTHORIZED_CHALLENGE_ACCEPT)"
    );

    // Test 37 & 38: Decline challenge flow
    friendClient2.ws.send(
      JSON.stringify({
        type: "DECLINE_CHALLENGE",
        payload: { challengeId: activeChallengeId },
      })
    );
    const declinedMsg = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "CHALLENGE_DECLINED" && m.payload.challengeId === activeChallengeId
    );
    assert(
      declinedMsg.payload.userId === USER_2.id,
      "Test 37: Challenger receives CHALLENGE_DECLINED notification"
    );

    const declinedRecord = await db.gameChallenge.findUnique({
      where: { id: activeChallengeId },
    });
    assert(
      declinedRecord?.status === "DECLINED",
      "Test 38: Declining updates challenge DB status to DECLINED"
    );

    // Test 39: Cancellation flow
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_2.id },
      })
    );
    const challengeToCancel = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "CHALLENGE_RECEIVED" && m.payload.challengeId !== activeChallengeId
    );
    friendClient1.ws.send(
      JSON.stringify({
        type: "CANCEL_CHALLENGE",
        payload: { challengeId: challengeToCancel.payload.challengeId },
      })
    );
    const cancelledMsg = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "CHALLENGE_CANCELLED" && m.payload.challengeId === challengeToCancel.payload.challengeId
    );
    assert(
      Boolean(cancelledMsg),
      "Test 39: Challenger can cancel challenge and target receives CHALLENGE_CANCELLED"
    );

    // Test 40: Expired challenge cannot be accepted
    const expiredChallengeId = randomUUID();
    const expiredRecord = await db.gameChallenge.create({
      data: {
        id: expiredChallengeId,
        challengerId: USER_1.id,
        challengedId: USER_2.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() - 5000), // expired 5 seconds ago
      },
    });

    friendClient2.ws.send(
      JSON.stringify({
        type: "ACCEPT_CHALLENGE",
        payload: { challengeId: expiredRecord.id },
      })
    );
    const expiredErr = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "ERROR" && m.payload.code === "CHALLENGE_EXPIRED"
    );
    assert(
      expiredErr.payload.code === "CHALLENGE_EXPIRED",
      "Test 40: Expired challenge cannot be accepted (CHALLENGE_EXPIRED)"
    );

    // Test 41, 42, 43, 44, 45: Full acceptance and game engine execution!
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_2.id },
      })
    );
    const matchToAccept = await waitForMessage(
      friendClient2.messages,
      (m) =>
        m.type === "CHALLENGE_RECEIVED" &&
        m.payload.challengeId !== activeChallengeId &&
        m.payload.challengeId !== challengeToCancel.payload.challengeId
    );

    const gameChallengeId = matchToAccept.payload.challengeId;

    friendClient2.ws.send(
      JSON.stringify({
        type: "ACCEPT_CHALLENGE",
        payload: { challengeId: gameChallengeId },
      })
    );

    // Both players receive CHALLENGE_ACCEPTED
    const p1Accepted = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "CHALLENGE_ACCEPTED" && m.payload.challengeId === gameChallengeId
    );
    const p2Accepted = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "CHALLENGE_ACCEPTED" && m.payload.challengeId === gameChallengeId
    );
    assert(
      p1Accepted.payload.gameId === p2Accepted.payload.gameId,
      "Test 41: Both players receive CHALLENGE_ACCEPTED with identical gameId"
    );

    const challengeAcceptedDb = await db.gameChallenge.findUnique({
      where: { id: gameChallengeId },
    });
    assert(
      challengeAcceptedDb?.status === "ACCEPTED",
      "Test 42: Challenge status in DB transitioned to ACCEPTED"
    );

    // Existing game engine triggers GAME_STARTED and first QUESTION
    const p1Started = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "GAME_STARTED" && m.payload.gameId === p1Accepted.payload.gameId
    );
    const p2Started = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "GAME_STARTED" && m.payload.gameId === p2Accepted.payload.gameId
    );
    assert(
      p1Started.payload.opponent.id === USER_2.id && p2Started.payload.opponent.id === USER_1.id,
      "Test 43: Both players receive GAME_STARTED with correct opponent data"
    );

    const p1Question = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "QUESTION" && m.payload.gameId === p1Accepted.payload.gameId
    );
    assert(
      p1Question.payload.questionNumber === 1,
      "Test 44: Existing game engine serves first QUESTION to challenger"
    );

    // Complete the game (P1 answers 10 questions correctly)
    const activeChallengeGameId = p1Accepted.payload.gameId;
    let challengeActiveQ = p1Question.payload.question;
    for (let i = 1; i <= 10; i++) {
      const correctAns = solveQuestion(challengeActiveQ);
      friendClient1.ws.send(
        JSON.stringify({
          type: "SUBMIT_ANSWER",
          payload: {
            gameId: activeChallengeGameId,
            questionId: challengeActiveQ.id,
            answer: correctAns,
          },
        })
      );
      await waitForMessage(
        friendClient1.messages,
        (m) =>
          m.type === "ANSWER_RESULT" &&
          m.payload.questionId === challengeActiveQ.id &&
          m.payload.correct === true
      );

      if (i < 10) {
        const nextQMsg = await waitForMessage(
          friendClient1.messages,
          (m) =>
            m.type === "QUESTION" &&
            m.payload.gameId === activeChallengeGameId &&
            m.payload.questionNumber === i + 1
        );
        challengeActiveQ = nextQMsg.payload.question;
      }
    }

    const p1GameOver = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "GAME_OVER" && m.payload.gameId === activeChallengeGameId
    );
    assert(
      p1GameOver.payload.reason === "COMPLETED",
      "Test 45: Challenge game completes successfully via existing game engine (GAME_OVER)"
    );

    const persistedChallengeGame = await db.game.findUnique({
      where: { id: activeChallengeGameId },
    });
    assert(
      persistedChallengeGame?.status === "OVER",
      "Test 46: Challenge game persisted in DB with status OVER"
    );

    // Test 47: Malformed challenge message rejected
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: "not-a-uuid" },
      })
    );
    const malformedErr = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "ERROR" && m.payload.code === "INVALID_MESSAGE_PAYLOAD"
    );
    assert(
      malformedErr.payload.code === "INVALID_MESSAGE_PAYLOAD",
      "Test 47: Malformed friendId is rejected with INVALID_MESSAGE_PAYLOAD"
    );

    // Test 48: Non-existent challenge ID rejected
    friendClient2.ws.send(
      JSON.stringify({
        type: "ACCEPT_CHALLENGE",
        payload: { challengeId: "00000000-0000-0000-0000-000000000000" },
      })
    );
    const notFoundErr = await waitForMessage(
      friendClient2.messages,
      (m) => m.type === "ERROR" && m.payload.code === "CHALLENGE_NOT_FOUND"
    );
    assert(
      notFoundErr.payload.code === "CHALLENGE_NOT_FOUND",
      "Test 48: Accepting non-existent challenge returns CHALLENGE_NOT_FOUND"
    );

    // Test 49: Pending challenges can be retrieved after reconnect/login
    const pendingReconnectChallengeId = randomUUID();
    await db.gameChallenge.create({
      data: {
        id: pendingReconnectChallengeId,
        challengerId: USER_1.id,
        challengedId: USER_2.id,
        status: "PENDING",
        expiresAt: new Date(Date.now() + 300000),
      },
    });

    const retrievedPending = await db.gameChallenge.findMany({
      where: {
        challengedId: USER_2.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: { challenger: { select: { id: true, username: true } } },
    });
    assert(
      retrievedPending.some((c) => c.id === pendingReconnectChallengeId),
      "Test 49: Pending challenge is retrievable from DB upon reconnect/login"
    );

    // Clean up reconnect challenge
    await db.gameChallenge.delete({ where: { id: pendingReconnectChallengeId } });

    // Test 50: Cannot challenge player who is currently in an active game
    // Put USER_2 into matchmaking with USER_3 to create an active game
    friendClient2.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    nonFriendClient.ws.send(JSON.stringify({ type: "PLAY_GAME", payload: {} }));
    await waitForMessage(friendClient2.messages, (m) => m.type === "GAME_STARTED");

    // USER_1 now tries to challenge USER_2 while USER_2 is in game
    friendClient1.ws.send(
      JSON.stringify({
        type: "CHALLENGE_FRIEND",
        payload: { friendId: USER_2.id },
      })
    );
    const targetBusyErr = await waitForMessage(
      friendClient1.messages,
      (m) => m.type === "ERROR" && m.payload.code === "TARGET_IN_GAME"
    );
    assert(
      targetBusyErr.payload.code === "TARGET_IN_GAME",
      "Test 50: Cannot challenge player currently in an active game (TARGET_IN_GAME)"
    );

    friendClient1.ws.close();
    friendClient2.ws.close();
    nonFriendClient.ws.close();
  } catch (error) {
    console.error("Test execution encountered an error:", error);
    testsFailed++;
  } finally {
    await server.stop();
    console.log("\n=================================================");
    console.log(`TOTAL TESTS: ${testsPassed + testsFailed}`);
    console.log(`PASSED: ${testsPassed}`);
    console.log(`FAILED: ${testsFailed}`);
    console.log("=================================================");

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
