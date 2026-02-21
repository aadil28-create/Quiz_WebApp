// backend/quizRepository.js
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const STATE_FILE = path.join(DATA_DIR, "quizState.json");

// ------------------------
// Ensure data directory exists
// ------------------------
async function ensureDataDir() {
  try {
    await fsp.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("❌ Failed to create data directory:", err);
    throw err;
  }
}

// ------------------------
// Generate empty initial state
// ------------------------
function emptyState() {
  return {
    status: "WAITING",
    hostId: null,
    currentQuestionIndex: -1,
    questionStartTime: null,
    players: {},
    questions: [],
    currentAnswers: {},
    answerHistory: {},
    lastAnswerTime: {},
    timeline: [],
    quizStartTime: null,
    quizEndTime: null,
    participantLink: null,
    linkActive: false,
    linkExpiry: null,
    lastUpdated: Date.now(),
  };
}

// ------------------------
// Load persisted quiz state (auto-create if missing)
// ------------------------
async function loadState() {
  try {
    await ensureDataDir();

    const exists = await fsp.stat(STATE_FILE).then(() => true).catch(() => false);
    if (!exists) {
      const initial = emptyState();
      await fsp.writeFile(STATE_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }

    const raw = await fsp.readFile(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Failed to load quiz state:", err);
    return emptyState(); // fallback even on error
  }
}

// ------------------------
// Save quiz state safely
// ------------------------
async function saveState(state) {
  try {
    await ensureDataDir();

    const persistable = {
      status: state.status,
      hostId: state.hostId,
      currentQuestionIndex: state.currentQuestionIndex,
      questionStartTime: state.questionStartTime,
      players: Object.fromEntries(
        Object.entries(state.players).map(([id, p]) => [
          id,
          { id: p.id, name: p.name, score: p.score },
        ])
      ),
      questions: state.questions,
      quizStartTime: state.quizStartTime,
      quizEndTime: state.quizEndTime,
      participantLink: state.participantLink || null,
      linkActive: !!state.linkActive,
      linkExpiry: state.linkExpiry || null,
      lastUpdated: Date.now(),
    };

    // Atomic write
    const tmpFile = STATE_FILE + ".tmp";
    await fsp.writeFile(tmpFile, JSON.stringify(persistable, null, 2), "utf-8");
    await fsp.rename(tmpFile, STATE_FILE);
  } catch (err) {
    console.error("❌ Failed to save quiz state:", err);
    throw err;
  }
}

// ------------------------
// Clear persisted quiz state
// ------------------------
async function clearState() {
  try {
    const exists = await fsp.stat(STATE_FILE).then(() => true).catch(() => false);
    if (exists) await fsp.unlink(STATE_FILE);
  } catch (err) {
    console.error("❌ Failed to clear quiz state:", err);
    throw err;
  }
}

module.exports = {
  loadState,
  saveState,
  clearState,
};
