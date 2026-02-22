import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Fastify from "fastify";
import { io as Client, Socket } from "socket.io-client";

import setupSocket from "../../../backend/socket";
import quizState from "../../../backend/quizState";

const TEST_TIMEOUT = 30000; // 30s to handle async socket operations
const HOST_USERNAME = process.env.HOST_USERNAME || "admin";
const HOST_PASSWORD = process.env.HOST_PASSWORD || "1234";

describe("Socket + QuizState Integration", () => {
  let fastify: any;
  let ioServer: any;
  let hostClient: Socket;
  let playerClient: Socket;

  beforeEach(async () => {
    quizState.reset();

    // Initialize Fastify
    fastify = Fastify({ logger: false });
    await fastify.ready();

    // Attach socket server
    ioServer = setupSocket(fastify.server, fastify);

    // Start Fastify on random port
    const address: any = await fastify.listen({ port: 0 });
    const baseURL = `http://localhost:${address.port}`;

    // Connect clients
    hostClient = Client(baseURL, { transports: ["websocket"] });
    playerClient = Client(baseURL, { transports: ["websocket"] });

    // Wait for connection
    await Promise.all([
      new Promise<void>((resolve) => hostClient.on("connect", () => resolve())),
      new Promise<void>((resolve) => playerClient.on("connect", () => resolve())),
    ]);
  }, TEST_TIMEOUT);

  afterEach(async () => {
    hostClient?.disconnect();
    playerClient?.disconnect();
    await ioServer?.close();
    await fastify.close();
  });

  it(
    "should allow host login",
    async () => {
      await new Promise<void>((resolve) => {
        hostClient.on("joined_successfully", (payload: any) => {
          expect(payload.isHost).toBe(true);
          expect(quizState.hostId).not.toBeNull();
          resolve();
        });

        hostClient.emit("host_login", {
          username: HOST_USERNAME,
          password: HOST_PASSWORD,
        });
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should allow participant to join",
    async () => {
      await new Promise<void>((resolve) => {
        playerClient.on("joined_successfully", (payload: any) => {
          expect(payload.isHost).toBe(false);
          expect(Object.keys(quizState.players)).toHaveLength(1);
          resolve();
        });

        playerClient.emit("join_quiz", { name: "Alice" });
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should start quiz when host triggers start",
    async () => {
      // login host
      await new Promise<void>((resolve) => {
        hostClient.on("joined_successfully", () => resolve());
        hostClient.emit("host_login", {
          username: HOST_USERNAME,
          password: HOST_PASSWORD,
        });
      });

      // add minimal question manually
      quizState.questions.push({
        id: "q1",
        text: "Test?",
        options: ["A", "B"],
        correctIndex: 0,
        timeLimit: 5,
      });

      await new Promise<void>((resolve) => {
        hostClient.on("quiz_state", (state: any) => {
          if (state.status === "LIVE") {
            expect(quizState.status).toBe("LIVE");
            resolve();
          }
        });

        hostClient.emit("start_quiz");
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should record answer updates",
    async () => {
      // host login
      await new Promise<void>((resolve) => {
        hostClient.on("joined_successfully", () => resolve());
        hostClient.emit("host_login", {
          username: HOST_USERNAME,
          password: HOST_PASSWORD,
        });
      });

      // player join
      let playerId: string = "";
      await new Promise<void>((resolve) => {
        playerClient.on("joined_successfully", (payload: any) => {
          playerId = payload.player.id;
          resolve();
        });

        playerClient.emit("join_quiz", { name: "Bob" });
      });

      // simulate LIVE quiz
      quizState.status = "LIVE";
      quizState.currentQuestionIndex = 0;
      quizState.questions.push({
        id: "q1",
        text: "Test?",
        options: ["A", "B"],
        correctIndex: 0,
        timeLimit: 5,
      });

      await new Promise<void>((resolve) => {
        playerClient.emit("answer_update", { answer: 0 });

        setTimeout(() => {
          expect(quizState.currentAnswers[playerId]).toBe(0);
          resolve();
        }, 50);
      });
    },
    TEST_TIMEOUT
  );

  it(
    "should mark player disconnected properly",
    async () => {
      let playerId: string = "";

      await new Promise<void>((resolve) => {
        playerClient.on("joined_successfully", (payload: any) => {
          playerId = payload.player.id;
          resolve();
        });

        playerClient.emit("join_quiz", { name: "Charlie" });
      });

      playerClient.disconnect();
      await new Promise((r) => setTimeout(r, 50));

      expect(quizState.players[playerId].socketId).toBeNull();
    },
    TEST_TIMEOUT
  );
});
