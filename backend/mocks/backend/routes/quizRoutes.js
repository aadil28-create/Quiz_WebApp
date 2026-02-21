// mocks/backend/routes/quizRoutes.js
async function quizRoutes(fastify) {
    // ------------------------
    // Middleware: skip rate limiting in mock
    // ------------------------
    fastify.addHook("preHandler", async (request, reply) => {
      // no-op
    });
  
    // ------------------------
    // GET /api/results
    // ------------------------
    fastify.get("/api/results", async () => {
      return {
        status: "ok",
        results: [
          { id: "player1", name: "Alice", score: 100 },
          { id: "player2", name: "Bob", score: 80 },
        ],
      };
    });
  
    // ------------------------
    // GET /api/quiz-state
    // ------------------------
    fastify.get("/api/quiz-state", async () => {
      return {
        status: "ok",
        quiz: {
          status: "LIVE",
          players: [
            { id: "player1", name: "Alice", score: 100 },
            { id: "player2", name: "Bob", score: 80 },
          ],
          currentQuestionIndex: 0,
          totalQuestions: 5,
          quizStartTime: Date.now() - 10000,
          quizEndTime: Date.now() + 60000,
          currentQuestion: {
            id: "q1",
            prompt: "Mock question?",
            options: ["A", "B", "C", "D"],
            type: "MCQ",
          },
          remainingTime: 15,
          answerHistory: {},
          participantLink: "mock-link",
          linkExpiry: null,
        },
      };
    });
  }
  
  module.exports = quizRoutes;
  