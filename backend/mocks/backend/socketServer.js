// mocks/backend/socketServer.js
const quizState = require("./quizState");

/**
 * Mock Socket.IO server for testing
 * @param {object} httpServer - ignored in mock
 * @param {object} fastify - mocked Fastify instance with log
 */
function createSocketServer(httpServer, fastify) {
  const log = fastify?.log || console;
  log.info("Initializing Mock Socket.IO...");

  // Mock io object
  const emittedEvents = [];
  const io = {
    on: (event, cb) => log.info(`Mock io.on registered for event: ${event}`),
    emit: (event, payload) => {
      emittedEvents.push({ event, payload });
      log.info(`Mock io.emit called for event: ${event}`, payload);
    },
    close: () => log.info("Mock io.close called"),
    emittedEvents, // expose for tests
  };

  // Load mocked socket logic
  try {
    const socketLogic = require("./socket");
    if (typeof socketLogic !== "function") throw new Error("socket.js must export a function");
    socketLogic(io, fastify);
    log.info("Mock socket logic loaded successfully");
  } catch (err) {
    log.error("Failed to load mock socket logic:", err);
    throw err;
  }

  // Mock REST endpoint consistent with main app
  fastify.get("/api/results", async () => {
    const participants = Object.values(quizState.players)
      .map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        connected: !!p.socketId,
      }))
      .sort((a, b) => b.score - a.score);

    let rank = 1;
    let lastScore = null;
    participants.forEach((p, idx) => {
      if (lastScore !== null && p.score < lastScore) rank = idx + 1;
      p.rank = rank;
      lastScore = p.score;
    });

    return { quizId: "mock", participants };
  });

  // Graceful shutdown mock (safe for repeated test runs)
  const shutdown = () => log.info("Mock Socket.IO shutdown");
  if (!process.__mockSocketShutdownAttached) {
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.__mockSocketShutdownAttached = true;
  }

  log.info("Mock Socket.IO ready");
  return io;
}

module.exports = createSocketServer;
