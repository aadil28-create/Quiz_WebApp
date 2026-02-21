// backend/server.js
require("dotenv").config();

const createApp = require("./app");
const createSocketServer = require("./socketServer");
const adminQuizRoutes = require("./routes/adminQuizRoutes");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

async function startServer() {
  try {
    // ------------------------
    // Create Fastify instance
    // ------------------------
    const fastify = createApp();

    // ------------------------
    // Attach Socket.IO before listen
    // ------------------------
    const io = createSocketServer(fastify.server, fastify);
    fastify.decorate("io", io);

    // ------------------------
    // Register Admin routes
    // ------------------------
    fastify.register(adminQuizRoutes);

    // ------------------------
    // Wait for Fastify to be ready
    // ------------------------
    await fastify.ready();

    // ------------------------
    // Start the HTTP server
    // ------------------------
    await fastify.listen({ port: PORT, host: HOST });

    fastify.log.info("Socket.IO initialized successfully");
    fastify.log.info(`🚀 Server running at http://${HOST}:${PORT}`);

    // ------------------------
    // Graceful shutdown
    // ------------------------
    const shutdown = async () => {
      fastify.log.info("🛑 Shutting down server...");
      try { await io.close(); } catch (err) { fastify.log.error("❌ Error closing Socket.IO:", err); }
      try { await fastify.close(); } catch (err) { fastify.log.error("❌ Error closing Fastify:", err); }
      fastify.log.info("✅ Shutdown complete");
      process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (err) {
    console.error("❌ Server failed to start:");
    console.error(err.stack || err);
    process.exit(1);
  }
}

startServer();
