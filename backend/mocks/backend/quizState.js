// mocks/backend/quizState.js

function createMockQuizState() {
  const state = {
    status: "WAITING",
    quizStartTime: null,
    quizEndTime: null,
    currentQuestionIndex: -1,
    questionStartTime: null,
    questionEndTime: null,
    timer: null,
    answerLocked: false,
    hostId: null,
    players: {},
    questions: [],
    currentAnswers: {},
    answerHistory: {},
    lastAnswerTime: {},
    timeline: [],
    linkActive: false,
    participantLink: null,
    linkExpiry: null,
    lastUpdated: null,

    // -------------------------
    // Utility methods
    // -------------------------
    reset() {
      this.status = "WAITING";
      this.quizStartTime = null;
      this.quizEndTime = null;
      this.currentQuestionIndex = -1;
      this.questionStartTime = null;
      this.questionEndTime = null;
      if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
      }
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

    // -------------------------
    // Test helpers
    // -------------------------
    addPlayer(id, name = "Test Player") {
      this.players[id] = { id, name, score: 0, socketId: null };
    },
  };

  return state;
}

module.exports = createMockQuizState();
