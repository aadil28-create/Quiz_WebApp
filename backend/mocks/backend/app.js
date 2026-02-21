// mocks/backend/app.js
const Fastify = require("fastify");
const quizStateMock = require("./quizState");

/**
 * Mocked Fastify app for testing
 * @param {object} options
 * @param {import('socket.io').Server} [options.io] - optional socket injection
 * @returns {import('fastify').FastifyInstance}
 */
function createApp({ io } = {}) {
  const fastify = Fastify({ logger: false });

  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
  }));

  // Quiz results endpoint
  fastify.get("/api/results", async () => {
    const players = Object.values(quizStateMock.players).map((p) => ({
      id: p.id,
      name: p.name,
      group: p.group || null,
      score: p.score,
      answers: p.answers ?? 0,
      correct: p.correct ?? 0,
      connected: !!p.socketId,
    }));

    // Compute rank
    const sorted = [...players].sort((a, b) => b.score - a.score);
    let rank = 1;
    let lastScore = null;
    sorted.forEach((p, idx) => {
      if (lastScore !== null && p.score < lastScore) rank = idx + 1;
      p.rank = rank;
      lastScore = p.score;
    });

    return { status: "ok", results: sorted };
  });

  // Mock register method for plugins (noop)
  fastify.register = fastify.register || (() => fastify);

  // Optional socket injection for integration tests
  if (io) {
    require("./socket")(io, fastify);
  }

  return fastify;
}

module.exports = createApp;
