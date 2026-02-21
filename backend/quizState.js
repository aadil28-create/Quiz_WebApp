/**
 * Central in-memory quiz state.
 * This object is the authoritative source for quiz lifecycle, questions, players, and answers.
 * Only persistable data is saved to disk via quizRepository; in-memory timers are not persisted.
 */
const quizState = {
  // =========================
  // Quiz lifecycle
  // =========================
  status: "WAITING", // WAITING | SCHEDULED | LIVE | FINISHED

  // Absolute timeline authority
  quizStartTime: null,
  quizEndTime: null,

  // Index of current question (-1 before start)
  currentQuestionIndex: -1,

  // Timestamp when current question started / ends
  questionStartTime: null,
  questionEndTime: null,

  // In-memory timer reference (not persisted)
  timer: null,

  // Locks answers once questionEndTime reached
  answerLocked: false,

  // =========================
  // Host
  // =========================
  hostId: null,

  // =========================
  // Players
  // =========================
  players: {},

  // =========================
  // Questions
  // =========================
  questions: [],

  // =========================
  // Answer tracking
  // =========================
  currentAnswers: {},
  answerHistory: {},
  lastAnswerTime: {},

  // =========================
  // Timeline schedule
  // =========================
  timeline: [],

  // =========================
  // Shareable link control
  // =========================
  linkActive: false,       // is the quiz link active
  participantLink: null,   // unique UUID for participants
  linkExpiry: null,        // timestamp of link expiry; null = no expiry

  // =========================
  // Metadata
  // =========================
  lastUpdated: null,

  // =========================
  // Utility methods
  // =========================
  reset() {
    this.status = "WAITING";
    this.quizStartTime = null;
    this.quizEndTime = null;
    this.currentQuestionIndex = -1;
    this.questionStartTime = null;
    this.questionEndTime = null;
    this.timer = null;
    this.answerLocked = false;
    this.hostId = null;
    this.players = {};
    this.questions = [];
    this.currentAnswers = {};
    this.answerHistory = {};
    this.lastAnswerTime = {};
    this.timeline = [];
    this.linkActive = false;
    this.participantLink = null;
    this.linkExpiry = null;
    this.lastUpdated = Date.now();
  },

  touch() {
    this.lastUpdated = Date.now();
  },

  // -------------------------
  // Shareable link helpers
  // -------------------------
  isLinkValid() {
    if (!this.linkActive || !this.participantLink) return false;
    if (this.linkExpiry && Date.now() > this.linkExpiry) return false;
    return true;
  },

  activateLink(expiryTimestamp = null, participantLink = null) {
    this.linkActive = true;
    this.linkExpiry = expiryTimestamp;
    if (participantLink) this.participantLink = participantLink;
    this.touch();
  },

  deactivateLink() {
    this.linkActive = false;
    this.participantLink = null;
    this.linkExpiry = null;
    this.touch();
  },
};

module.exports = quizState;
