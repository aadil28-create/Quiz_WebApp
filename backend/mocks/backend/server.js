// mocks/backend/server.js
require("dotenv").config();

const createApp = require("./app");
const createSocketServer = require("./socketServer");
const adminQuizRoutes = require("./routes/adminQuizRoutes");

async function startServer() {
  try {
    // ------------------------
    // Create mocked Fastify instance
    // ------------------------
    const fastify = createApp();

    // ------------------------
    // Attach mocked Socket.IO with real event simulation
    // ------------------------
    const io = createSocketServer(null, fastify);
    fastify.decorate("io", io);

    // ------------------------
    // Register Admin routes (noop for mocks)
    // ------------------------
    fastify.register(adminQuizRoutes);

    // ------------------------
    // Simulate ready
    // ------------------------
    await fastify.ready();
    console.log("✅ Mock server ready (no real network started)");

    // ------------------------
    // Mock graceful shutdown without exiting process
    // ------------------------
    const shutdown = async () => {
      console.log("🛑 Mock server shutdown");
      // Do not call process.exit() in test environment
      if (io && typeof io.close === "function") {
        io.close();
      }
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("❌ Mock server failed to start:");
    console.error(err.stack || err);
    // Avoid process.exit in test environment
  }
}

startServer();
