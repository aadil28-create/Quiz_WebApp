const quizState = require("./quizState");

const generateId = (() => {
  let i = 0;
  return () => `q_${i++}`;
})();

class QuizEngine {
  static computeTimeline(forceRebuild = false) {
    if (!forceRebuild && quizState.timeline?.length === quizState.questions.length && quizState.quizStartTime) {
      return;
    }

    let cursor = quizState.quizStartTime || Date.now();
    quizState.timeline = quizState.questions.map((q) => {
      const startTime = cursor;
      const endTime = startTime + (q.timeLimit || 15) * 1000;
      cursor = endTime;
      return { questionId: q.id, startTime, endTime };
    });
    quizState.quizStartTime = quizState.timeline[0]?.startTime || null;
    quizState.quizEndTime = quizState.timeline.at(-1)?.endTime || null;
  }

  static async startQuiz(io) {
    quizState.status = "LIVE";
    quizState.currentQuestionIndex = -1;
    quizState.answerHistory = {};
    quizState.currentAnswers = {};
    quizState.lastAnswerTime = {};
    this.computeTimeline(true);
    await this.broadcastState(io);
  }

  static async advanceIfNeeded(io) { /* no-op for mock */ }
  static recoverTimer(io) { /* no-op */ }
  static async lockAnswers(io) { /* no-op */ }
  static freezeAnswers() { /* no-op */ }
  static scoreQuestion() { /* no-op */ }

  static async finishQuiz(io) {
    quizState.status = "FINISHED";
    await this.broadcastState(io);
  }

  static async updateAnswer(playerId, answer, io) {
    quizState.currentAnswers[playerId] = answer;
    await this.broadcastState(io);
  }

  static buildState() {
    const q = quizState.questions[quizState.currentQuestionIndex];
    return {
      status: quizState.status,
      players: Object.values(quizState.players),
      currentQuestionIndex: quizState.currentQuestionIndex,
      totalQuestions: quizState.questions.length,
      quizStartTime: quizState.quizStartTime,
      quizEndTime: quizState.quizEndTime,
      currentQuestion: quizState.answerLocked || !q ? q : { ...q, correctIndex: undefined, correctAnswer: undefined },
      remainingTime: 0,
      answerHistory: quizState.answerHistory,
      participantLink: quizState.participantLink || null,
      linkExpiry: quizState.linkExpiry || null,
    };
  }

  static clearTimers() { 
    if (quizState.timer) clearTimeout(quizState.timer);
    quizState.timer = null;
  }

  // -------------------------
  // Admin helpers
  // -------------------------
  static getStatus() { return quizState.status; }
  static getAllPlayers() { return Object.values(quizState.players); }
  static resetQuiz() { quizState.reset(); }

  static async addQuestion(io, qData) {
    const newQ = { id: generateId(), ...qData, options: qData.options || [] };
    quizState.questions.push(newQ);
    this.computeTimeline(true);
    await this.broadcastState(io);
    return newQ;
  }

  static async updateQuestion(io, id, updates) {
    const q = quizState.questions.find(q => q.id === id);
    if (!q) return null;
    Object.assign(q, updates);
    this.computeTimeline(true);
    await this.broadcastState(io);
    return q;
  }

  static async deleteQuestion(io, id) {
    const index = quizState.questions.findIndex(q => q.id === id);
    if (index === -1) return false;
    quizState.questions.splice(index, 1);
    this.computeTimeline(true);
    await this.broadcastState(io);
    return true;
  }

  static async activateLink(io, expiryTimestamp = null) {
    quizState.participantLink = "mock-link";
    quizState.linkExpiry = expiryTimestamp;
    await this.broadcastState(io);
  }

  static async deactivateLink(io) {
    quizState.participantLink = null;
    quizState.linkExpiry = null;
    await this.broadcastState(io);
  }

  // -------------------------
  // Socket helper
  // -------------------------
  static async broadcastState(io) {
    if (!io) return;
    const state = this.buildState();
    io.emit("quiz_state", state);
  }
}

module.exports = QuizEngine;
