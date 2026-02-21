// backend/app.js
const Fastify = require("fastify");
const cors = require("@fastify/cors");
const helmet = require("@fastify/helmet");
const compress = require("@fastify/compress");
const sensible = require("@fastify/sensible");

/**
 * Create a production-ready Fastify instance
 * @returns {import('fastify').FastifyInstance}
 */
function createApp() {
  const isDev = process.env.NODE_ENV !== "production";

  // ------------------------
  // Logger configuration
  // ------------------------
  const loggerConfig = isDev
    ? {
        level: process.env.LOG_LEVEL || "info",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: process.env.LOG_LEVEL || "info",
      };

  const fastify = Fastify({
    logger: loggerConfig,
    trustProxy: true, // for reverse proxy/load balancer scenarios
  });

  // ------------------------
  // Security & Middleware
  // ------------------------
  fastify.register(helmet); // secure HTTP headers

  fastify.register(cors, {
    origin: isDev
      ? "*" // allow all origins in dev
      : process.env.CORS_ORIGIN || "https://your-frontend.com",
    methods: ["GET", "POST", "OPTIONS"],
  });

  fastify.register(compress); // gzip/deflate compression
  fastify.register(sensible); // standardized error utilities

  // ------------------------
  // Strict JSON parser
  // ------------------------
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      try {
        done(null, JSON.parse(body));
      } catch (err) {
        done(fastify.httpErrors.badRequest("Invalid JSON body"));
      }
    }
  );

  // ------------------------
  // Health check endpoint
  // ------------------------
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
  }));

  // ------------------------
  // Quiz results endpoint
  // ------------------------
  fastify.get("/api/results", async (request, reply) => {
    try {
      const quizState = require("./quizState");
      const results = Object.values(quizState.players).map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
      }));

      return { status: "ok", results };
    } catch (err) {
      request.log.error(err);
      throw fastify.httpErrors.internalServerError(
        "Failed to fetch results"
      );
    }
  });

  // ------------------------
  // Future endpoints can be added here
  // ------------------------

  return fastify;
}

module.exports = createApp;
