// mocks/backend/routes/adminQuizRoutes.js
async function adminQuizRoutes(fastify) {
    // ------------------------
    // Mock middleware (skip auth & rate limiting)
    // ------------------------
    fastify.addHook("preHandler", async (request, reply) => {
      // no-op in mocks
    });
  
    // ------------------------
    // POST /api/admin/start-quiz
    // ------------------------
    fastify.post("/api/admin/start-quiz", async () => {
      return { status: "ok", message: "Mock quiz started" };
    });
  
    // ------------------------
    // POST /api/admin/add-question
    // ------------------------
    fastify.post("/api/admin/add-question", async (request) => {
      const { prompt, type } = request.body || {};
      if (!prompt || !type) return { status: "error", message: "Invalid question data" };
      return { status: "ok", question: { id: "mock-id", ...request.body } };
    });
  
    // ------------------------
    // PUT /api/admin/update-question
    // ------------------------
    fastify.put("/api/admin/update-question", async (request) => {
      const { id } = request.body || {};
      if (!id) return { status: "error", message: "Question not found" };
      return { status: "ok", question: { id, updated: true } };
    });
  
    // ------------------------
    // DELETE /api/admin/delete-question
    // ------------------------
    fastify.delete("/api/admin/delete-question", async (request) => {
      const { id } = request.body || {};
      if (!id) return { status: "error", message: "Question not found" };
      return { status: "ok", message: "Question deleted" };
    });
  
    // ------------------------
    // POST /api/admin/activate-quiz-link
    // ------------------------
    fastify.post("/api/admin/activate-quiz-link", async (request) => {
      const { expiry } = request.body || {};
      return { status: "ok", message: "Link activated", expiry: expiry || null };
    });
  
    // ------------------------
    // POST /api/admin/deactivate-quiz-link
    // ------------------------
    fastify.post("/api/admin/deactivate-quiz-link", async () => {
      return { status: "ok", message: "Link deactivated" };
    });
  }
  
  module.exports = adminQuizRoutes;
  