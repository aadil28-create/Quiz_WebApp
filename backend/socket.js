// backend/socket.js
const { v4: uuidv4 } = require("uuid");
const quizState = require("./quizState");
const quizRepository = require("./quizRepository");
const QuizEngine = require("./QuizEngine");

const HOST_CREDENTIALS = {
  username: process.env.HOST_USERNAME || "admin",
  password: process.env.HOST_PASSWORD || "1234",
};

/**
 * Setup Socket.IO quiz logic
 * @param {import("socket.io").Server} io
 * @param {import("fastify").FastifyInstance} fastify Optional logger
 */
async function setupSocket(io, fastify) {
  const log = fastify?.log || console;
  if (!io) throw new Error("Socket.IO server instance is required");

  // Restore persisted state safely
  try {
    const persisted = await quizRepository.loadState();
    if (persisted) {
      Object.assign(quizState, persisted);
      log.info("✅ Quiz state restored from disk");

      if (quizState.status === "LIVE") {
        QuizEngine.advanceIfNeeded(io); // re-sync current question
        QuizEngine.recoverTimer(io);    // ensure timer continues correctly
      }
    }
  } catch (err) {
    log.error("❌ Failed to restore quiz state:", err);
  }

  // Helper functions
  const findPlayerBySocket = (socketId) =>
    Object.values(quizState.players).find((p) => p.socketId === socketId);

  const isValidHostAction = (socket) =>
    quizState.hostId && quizState.players[quizState.hostId]?.socketId === socket.id;

  const isHostAllowedToEdit = (socket) =>
    isValidHostAction(socket) && quizState.status !== "LIVE";

  let lastBroadcastHash = null;
  const broadcastState = async () => {
    try {
      const state = QuizEngine.buildState();
      const hash = JSON.stringify(state);
      if (hash === lastBroadcastHash) return; // skip if unchanged
      lastBroadcastHash = hash;

      io.emit("quiz_state", state);
      await quizRepository.saveState(quizState);
    } catch (err) {
      log.error("❌ Failed to broadcast state:", err);
    }
  };

  // Socket event handlers
  io.on("connection", (socket) => {
    log.info(`✅ Socket connected: ${socket.id}`);

    // -------- Join Quiz --------
    socket.on("join_quiz", async ({ playerId, name }) => {
      if (!name || typeof name !== "string") return;
      const id = playerId || uuidv4();
      if (id === quizState.hostId) return;

      if (quizState.players[id]) {
        quizState.players[id].socketId = socket.id;
      } else {
        quizState.players[id] = { id, name, score: 0, socketId: socket.id };
      }

      socket.emit("joined_successfully", {
        player: quizState.players[id],
        isHost: false,
      });

      await broadcastState();
    });

    // -------- Host Login --------
    socket.on("host_login", async ({ username, password }) => {
      if (username !== HOST_CREDENTIALS.username || password !== HOST_CREDENTIALS.password) {
        socket.emit("host_login_failed", { message: "Invalid credentials" });
        return;
      }

      if (!quizState.hostId) {
        const hostId = uuidv4();
        quizState.hostId = hostId;
        quizState.players[hostId] = {
          id: hostId,
          name: username,
          score: 0,
          socketId: socket.id,
        };
        log.info("👑 Host created");
      } else {
        quizState.players[quizState.hostId].socketId = socket.id;
        log.info("🔄 Host reconnected");
      }

      socket.emit("joined_successfully", {
        player: quizState.players[quizState.hostId],
        isHost: true,
      });

      await broadcastState();
    });

    // -------- Question Management --------
    socket.on("add_question", async (q) => {
      if (!isHostAllowedToEdit(socket)) return;
      await QuizEngine.addQuestion(io, q); // pass io for broadcasting
      await broadcastState();
    });

    socket.on("update_question", async ({ id, updates }) => {
      if (!isHostAllowedToEdit(socket)) return;
      await QuizEngine.updateQuestion(io, id, updates); // pass io
      await broadcastState();
    });

    socket.on("delete_question", async ({ id }) => {
      if (!isHostAllowedToEdit(socket)) return;
      await QuizEngine.deleteQuestion(io, id); // pass io
      await broadcastState();
    });

    // -------- Quiz Control --------
    socket.on("start_quiz", async () => {
      if (!isValidHostAction(socket) || quizState.status === "LIVE") return;
      await QuizEngine.startQuiz(io);
      await broadcastState();
    });

    // -------- Answer Updates --------
    socket.on("answer_update", async ({ answer }) => {
      const player = findPlayerBySocket(socket.id);
      if (!player || player.id === quizState.hostId) return;
      await QuizEngine.updateAnswer(player.id, answer);
      await broadcastState();
    });

    // -------- Disconnect --------
    socket.on("disconnect", async () => {
      const player = findPlayerBySocket(socket.id);
      if (!player) return;
      player.socketId = null;
      await broadcastState();
    });
  });

  // Graceful shutdown
  const cleanup = async () => {
    log.info("🛑 Shutting down Quiz Socket server...");
    QuizEngine.clearTimers?.();
    try {
      await io.close();
      log.info("✅ Socket.IO closed successfully");
    } catch (err) {
      log.error("❌ Error closing Socket.IO:", err);
    }
  };

  process.once("SIGINT", cleanup);
  process.once("SIGTERM", cleanup);
}

module.exports = setupSocket;
