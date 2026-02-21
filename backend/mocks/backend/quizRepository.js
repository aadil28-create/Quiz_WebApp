// mocks/backend/quizRepository.js
const quizStateMock = require("./quizState");

// Deep clone utility
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// In-memory persisted state
let inMemoryState = deepClone(quizStateMock);

// ------------------------
// Load persisted quiz state (mocked)
// ------------------------
async function loadState() {
  // Return a deep copy to simulate reading from disk
  return deepClone(inMemoryState);
}

// ------------------------
// Save quiz state safely (mocked)
// ------------------------
async function saveState(state) {
  // Validate minimal required fields
  if (!state || typeof state !== "object") {
    throw new Error("Invalid state object passed to saveState");
  }

  inMemoryState = {
    status: state.status ?? "WAITING",
    hostId: state.hostId ?? null,
    currentQuestionIndex: state.currentQuestionIndex ?? -1,
    questionStartTime: state.questionStartTime ?? null,
    players: Object.fromEntries(
      Object.entries(state.players || {}).map(([id, p]) => [
        id,
        {
          id: p.id,
          name: p.name,
          score: p.score ?? 0,
          // optionally persist answers/correct if needed
          answers: p.answers ?? 0,
          correct: p.correct ?? 0,
        },
      ])
    ),
    questions: Array.isArray(state.questions) ? deepClone(state.questions) : [],
    quizStartTime: state.quizStartTime ?? null,
    quizEndTime: state.quizEndTime ?? null,
    participantLink: state.participantLink ?? null,
    linkActive: !!state.linkActive,
    linkExpiry: state.linkExpiry ?? null,
    lastUpdated: Date.now(),
  };

  return deepClone(inMemoryState);
}

// ------------------------
// Clear persisted quiz state (mocked)
// ------------------------
async function clearState() {
  inMemoryState = deepClone(quizStateMock);
  // normalize lastUpdated for clarity
  inMemoryState.lastUpdated = Date.now();
}

module.exports = {
  loadState,
  saveState,
  clearState,
};
