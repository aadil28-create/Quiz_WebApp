// backend/socketServer.js
const { Server } = require("socket.io");
const quizState = require("./quizState");

/**
 * Attach Socket.IO to Fastify server
 * @param {import('http').Server} httpServer
 * @param {import('fastify').FastifyInstance} fastify
 */
function createSocketServer(httpServer, fastify) {
  fastify.log.info("Initializing Socket.IO...");

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
  });

  fastify.log.info("Socket.IO initialized successfully");

  // Load socket logic
  try {
    const socketLogic = require("./socket");
    if (typeof socketLogic !== "function") throw new Error("socket.js must export a function");
    socketLogic(io, fastify);
    fastify.log.info("Socket logic loaded successfully");
  } catch (err) {
    fastify.log.error("Failed to load socket logic:", err);
    throw err; // crash fast
  }

  // REST endpoint for quiz results
  fastify.get("/quiz/:id/results", async (request, reply) => {
    try {
      const participants = Object.values(quizState.players)
        .map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          connected: !!p.socketId
        }))
        .sort((a, b) => b.score - a.score);

      let rank = 1;
      let lastScore = null;
      participants.forEach((p, idx) => {
        if (lastScore !== null && p.score < lastScore) rank = idx + 1;
        p.rank = rank;
        lastScore = p.score;
      });

      return { quizId: request.params.id, participants };
    } catch (err) {
      fastify.log.error(err);
      reply.code(500).send({ error: "Failed to retrieve quiz results" });
    }
  });

  // Graceful shutdown
  const shutdown = () => {
    fastify.log.info("Closing Socket.IO...");
    try { io.close(); } catch (err) { fastify.log.error("Socket.IO shutdown error:", err); }
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  fastify.log.info("Socket.IO ready");
  return io;
}

module.exports = createSocketServer;
