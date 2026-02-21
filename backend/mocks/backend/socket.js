const quizState = require("./quizState");
const QuizEngine = require("./QuizEngine");

async function setupSocket(io, fastify) {
  const log = fastify?.log || console;

  if (!io) throw new Error("Mock Socket.IO required");

  // Reset quiz state for test isolation
  QuizEngine.resetQuiz();

  let playerCounter = 0;
  const uuidv4 = () => `mock-uuid-${playerCounter++}`;

  const findPlayerBySocket = (socketId) =>
    Object.values(quizState.players).find((p) => p.socketId === socketId);

  const isValidHostAction = (socket) =>
    quizState.hostId && quizState.players[quizState.hostId]?.socketId === socket.id;

  const isHostAllowedToEdit = (socket) =>
    isValidHostAction(socket) && quizState.status !== "LIVE";

  io.on("connection", (socket) => {
    log.info(`✅ Mock socket connected: ${socket.id}`);

    socket.on("join_quiz", async ({ playerId, name }) => {
      const id = playerId || uuidv4();
      quizState.players[id] = { id, name, score: 0, socketId: socket.id };
      socket.emit("joined_successfully", { player: quizState.players[id], isHost: false });
      await QuizEngine.broadcastState(io);
    });

    socket.on("host_login", async ({ username }) => {
      const hostId = uuidv4();
      quizState.hostId = hostId;
      quizState.players[hostId] = { id: hostId, name: username, score: 0, socketId: socket.id };
      socket.emit("joined_successfully", { player: quizState.players[hostId], isHost: true });
      await QuizEngine.broadcastState(io);
    });

    socket.on("add_question", async (q) => {
      await QuizEngine.addQuestion(io, q);
    });

    socket.on("update_question", async ({ id, updates }) => {
      await QuizEngine.updateQuestion(io, id, updates);
    });

    socket.on("delete_question", async ({ id }) => {
      await QuizEngine.deleteQuestion(io, id);
    });

    socket.on("start_quiz", async () => {
      await QuizEngine.startQuiz(io);
    });

    socket.on("answer_update", async ({ answer }) => {
      const player = findPlayerBySocket(socket.id);
      if (player) {
        await QuizEngine.updateAnswer(player.id, answer, io);
      }
    });

    socket.on("disconnect", async () => {
      const player = findPlayerBySocket(socket.id);
      if (player) player.socketId = null;
      await QuizEngine.broadcastState(io);
    });
  });
}

module.exports = setupSocket;
