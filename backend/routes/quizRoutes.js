// backend/routes/quizRoutes.js
const QuizEngine = require("../QuizEngine");
const { RateLimiterMemory } = require("rate-limiter-flexible");

// Rate limiter: max 10 requests/sec per IP for public endpoints
const rateLimiter = new RateLimiterMemory({ points: 10, duration: 1 });

/**
 * Registers quiz-related REST endpoints to the Fastify instance
 * @param {import("fastify").FastifyInstance} fastify
 */
async function quizRoutes(fastify) {
  // ------------------------
  // Middleware: rate limiting for public endpoints
  // ------------------------
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await rateLimiter.consume(request.ip);
    } catch (err) {
      reply.code(429).send({ status: "error", message: "Too Many Requests" });
    }
  });

  // ------------------------
  // GET /api/results - player scores
  // ------------------------
  fastify.get("/api/results", async (request, reply) => {
    try {
      const players = QuizEngine.getAllPlayers();
      return { status: "ok", results: players };
    } catch (err) {
      request.log.error(err);
      throw fastify.httpErrors.internalServerError(
        "Failed to fetch quiz results"
      );
    }
  });

  // ------------------------
  // GET /api/quiz-state - current quiz state for players
  // ------------------------
  fastify.get("/api/quiz-state", async (request, reply) => {
    try {
      return { status: "ok", quiz: QuizEngine.buildState() };
    } catch (err) {
      request.log.error(err);
      throw fastify.httpErrors.internalServerError(
        "Failed to fetch quiz state"
      );
    }
  });

  // ------------------------
  // Additional public endpoints can be added here
  // ------------------------
}

module.exports = quizRoutes;
