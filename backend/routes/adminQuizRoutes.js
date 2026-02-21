// backend/routes/adminQuizRoutes.js
const QuizEngine = require("../QuizEngine");
const { v4: uuidv4 } = require("uuid");
const { RateLimiterMemory } = require("rate-limiter-flexible");

// ===== Hardcoded host credentials (production should use env vars or DB) =====
const HOST_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "1234",
};

// Rate limiter: 5 admin actions per second per IP
const rateLimiter = new RateLimiterMemory({ points: 5, duration: 1 });

/**
 * Registers admin REST endpoints for quiz management
 * @param {import("fastify").FastifyInstance} fastify
 */
async function adminQuizRoutes(fastify) {
  // ------------------------
  // Middleware: rate limiting + authentication
  // ------------------------
  fastify.addHook("preHandler", async (request, reply) => {
    try {
      await rateLimiter.consume(request.ip);
    } catch {
      reply.code(429).send({ status: "error", message: "Too Many Requests" });
      return;
    }

    const authHeader = request.headers["authorization"];
    if (!authHeader) {
      reply.code(401).send({ status: "error", message: "Missing Authorization" });
      return;
    }

    const token = authHeader.replace("Basic ", "");
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [username, password] = decoded.split(":");

    if (
      username !== HOST_CREDENTIALS.username ||
      password !== HOST_CREDENTIALS.password
    ) {
      reply.code(403).send({ status: "error", message: "Forbidden" });
      return;
    }
  });

  // ------------------------
  // POST /api/admin/start-quiz
  // ------------------------
  fastify.post("/api/admin/start-quiz", async (request, reply) => {
    try {
      const status = QuizEngine.getStatus();
      if (status === "LIVE") {
        return reply.code(400).send({ status: "error", message: "Quiz already live" });
      }

      await QuizEngine.startQuiz(fastify.io);
      return { status: "ok", message: "Quiz started" };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to start quiz" });
    }
  });

  // ------------------------
  // POST /api/admin/add-question
  // ------------------------
  fastify.post("/api/admin/add-question", async (request, reply) => {
    try {
      const { prompt, type, options, correctIndex, correctAnswer, timeLimit, score, negativeScore } = request.body;

      if (!prompt || !type) {
        return reply.code(400).send({ status: "error", message: "Invalid question data" });
      }

      const newQ = await QuizEngine.addQuestion(fastify.io, {
        prompt,
        type,
        options,
        correctIndex,
        correctAnswer,
        timeLimit,
        score,
        negativeScore,
      });

      return { status: "ok", question: newQ };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to add question" });
    }
  });

  // ------------------------
  // PUT /api/admin/update-question
  // ------------------------
  fastify.put("/api/admin/update-question", async (request, reply) => {
    try {
      const { id, updates } = request.body;
      const q = await QuizEngine.updateQuestion(fastify.io, id, updates);

      if (!q) return reply.code(404).send({ status: "error", message: "Question not found" });
      return { status: "ok", question: q };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to update question" });
    }
  });

  // ------------------------
  // DELETE /api/admin/delete-question
  // ------------------------
  fastify.delete("/api/admin/delete-question", async (request, reply) => {
    try {
      const { id } = request.body;
      const success = await QuizEngine.deleteQuestion(fastify.io, id);

      if (!success) return reply.code(404).send({ status: "error", message: "Question not found" });
      return { status: "ok", message: "Question deleted" };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to delete question" });
    }
  });

  // ------------------------
  // POST /api/admin/activate-quiz-link
  // ------------------------
  fastify.post("/api/admin/activate-quiz-link", async (request, reply) => {
    try {
      const { expiry } = request.body;
      let expiryTimestamp = null;

      if (expiry) {
        const ts = Date.parse(expiry);
        if (isNaN(ts)) {
          return reply.code(400).send({ status: "error", message: "Invalid expiry date" });
        }
        expiryTimestamp = ts;
      }

      await QuizEngine.activateLink(fastify.io, expiryTimestamp);

      return {
        status: "ok",
        message: "Link activated",
        expiry: expiryTimestamp ? new Date(expiryTimestamp).toISOString() : null,
      };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to activate link" });
    }
  });

  // ------------------------
  // POST /api/admin/deactivate-quiz-link
  // ------------------------
  fastify.post("/api/admin/deactivate-quiz-link", async (request, reply) => {
    try {
      await QuizEngine.deactivateLink(fastify.io);
      return { status: "ok", message: "Link deactivated" };
    } catch (err) {
      request.log.error(err);
      return reply.code(500).send({ status: "error", message: "Failed to deactivate link" });
    }
  });
}

module.exports = adminQuizRoutes;
