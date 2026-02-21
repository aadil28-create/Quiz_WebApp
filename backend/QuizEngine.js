const quizState = require("./quizState");
const quizRepository = require("./quizRepository");
const { v4: uuidv4 } = require("uuid");

class QuizEngine {
  // -------------------------
  // Compute timeline for all questions
  // -------------------------
  static computeTimeline(forceRebuild = false) {
    // Prevent accidental rebuild mid-quiz
    if (
      !forceRebuild &&
      quizState.timeline &&
      quizState.timeline.length === quizState.questions.length &&
      quizState.quizStartTime
    ) {
      return;
    }

    let cursor = quizState.quizStartTime || Date.now();

    quizState.timeline = quizState.questions.map((q) => {
      const timeLimit = typeof q.timeLimit === "number" ? q.timeLimit : 15;
      const startTime = cursor;
      const endTime = startTime + timeLimit * 1000;
      cursor = endTime;
      return { questionId: q.id, startTime, endTime };
    });

    quizState.quizStartTime = quizState.timeline[0]?.startTime || null;
    quizState.quizEndTime = quizState.timeline.at(-1)?.endTime || null;
  }

  // -------------------------
  // Start quiz (with optional link expiry)
  // -------------------------
  static async startQuiz(io, options = { linkExpiry: null }) {
    if (!quizState.questions.length) return;

    quizState.status = "LIVE";
    quizState.currentQuestionIndex = -1;
    quizState.answerHistory = {};
    quizState.currentAnswers = {};
    quizState.lastAnswerTime = {};

    // Generate a single shareable participant link
    quizState.participantLink = uuidv4();
    quizState.linkExpiry = options.linkExpiry || null;

    this.computeTimeline(true);

    await quizRepository.saveState(quizState);
    await this.advanceIfNeeded(io);
  }

  // -------------------------
  // Activate participant link manually
  // -------------------------
  static async activateLink(io, expiryTimestamp = null) {
    quizState.participantLink = quizState.participantLink || uuidv4();
    quizState.linkExpiry = expiryTimestamp;

    try {
      await quizRepository.saveState(quizState);
    } catch (err) {
      console.error("❌ Failed to save state on activateLink:", err);
    }

    try {
      io.emit("quiz_link_updated", {
        participantLink: quizState.participantLink,
        linkExpiry: quizState.linkExpiry,
      });
    } catch (err) {
      console.error("❌ Failed to emit quiz_link_updated:", err);
    }
  }

  // -------------------------
  // Deactivate participant link
  // -------------------------
  static async deactivateLink(io) {
    quizState.participantLink = null;
    quizState.linkExpiry = null;

    try {
      await quizRepository.saveState(quizState);
    } catch (err) {
      console.error("❌ Failed to save state on deactivateLink:", err);
    }

    try {
      io.emit("quiz_link_updated", { participantLink: null, linkExpiry: null });
    } catch (err) {
      console.error("❌ Failed to emit quiz_link_updated:", err);
    }
  }

  // -------------------------
  // Advance to current question based on timeline
  // -------------------------
  static async advanceIfNeeded(io) {
    if (quizState.status !== "LIVE") return;

    // Check link expiry
    if (quizState.linkExpiry && Date.now() > quizState.linkExpiry) {
      return await this.finishQuiz(io);
    }

    const now = Date.now();
    const nextIndex = quizState.timeline.findIndex(
      (t) => now >= t.startTime && now < t.endTime
    );

    if (nextIndex === -1) {
      if (now >= quizState.quizEndTime) {
        await this.finishQuiz(io);
      }
      return;
    }

    if (nextIndex !== quizState.currentQuestionIndex) {
      quizState.currentQuestionIndex = nextIndex;
      const entry = quizState.timeline[nextIndex];

      quizState.questionStartTime = entry.startTime;
      quizState.questionEndTime = entry.endTime;
      quizState.answerLocked = false;
      quizState.currentAnswers = {};
      quizState.lastAnswerTime = {};

      this.recoverTimer(io);
      try {
        await quizRepository.saveState(quizState);
      } catch (err) {
        console.error("❌ Failed to save state during advance:", err);
      }
    }
  }

  // -------------------------
  // Recover timer after refresh or restart
  // -------------------------
  static recoverTimer(io) {
    if (quizState.status !== "LIVE" || !quizState.questionEndTime) return;

    this.clearTimers();

    const delay = quizState.questionEndTime - Date.now();
    if (delay <= 0) {
      this.lockAnswers(io);
    } else {
      quizState.timer = setTimeout(() => this.lockAnswers(io), delay);
    }
  }

  // -------------------------
  // Lock answers, score, advance quiz
  // -------------------------
  static async lockAnswers(io) {
    if (quizState.answerLocked) return;

    quizState.answerLocked = true;
    this.freezeAnswers();
    this.scoreQuestion();

    try {
      await quizRepository.saveState(quizState);
    } catch (err) {
      console.error("❌ Failed to save state on lockAnswers:", err);
    }

    try {
      io.emit("quiz_state", this.buildState());
    } catch (err) {
      console.error("❌ Failed to emit quiz_state:", err);
    }

    await this.advanceIfNeeded(io);
  }

  // -------------------------
  // Freeze current answers into answerHistory
  // -------------------------
  static freezeAnswers() {
    const q = quizState.questions[quizState.currentQuestionIndex];
    if (!q) return;

    if (!quizState.answerHistory[q.id]) quizState.answerHistory[q.id] = {};
    const now = Date.now();

    for (const [playerId, answer] of Object.entries(quizState.currentAnswers)) {
      quizState.answerHistory[q.id][playerId] = { answer, submittedAt: now, lockedAt: now };
    }
  }

  // -------------------------
  // Score current question
  // -------------------------
  static scoreQuestion() {
    const q = quizState.questions[quizState.currentQuestionIndex];
    if (!q) return;

    const answers = quizState.answerHistory[q.id] || {};
    for (const [playerId, entry] of Object.entries(answers)) {
      if (entry.scored) continue;

      const player = quizState.players[playerId];
      if (!player) continue;

      const answer = entry.answer;

      if (q.type === "MCQ") {
        player.score += answer === q.correctIndex ? q.score : -(q.negativeScore || 0);
      } else {
        player.score +=
          String(answer).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
            ? q.score
            : -(q.negativeScore || 0);
      }

      entry.scored = true;
    }
  }

  // -------------------------
  // Finish quiz
  // -------------------------
  static async finishQuiz(io) {
    if (quizState.status === "FINISHED") return;

    quizState.status = "FINISHED";
    this.clearTimers();

    try {
      await quizRepository.saveState(quizState);
    } catch (err) {
      console.error("❌ Failed to save state on finish:", err);
    }

    try {
      io.emit("quiz_finished", Object.values(quizState.players));
    } catch (err) {
      console.error("❌ Failed to emit quiz_finished:", err);
    }
  }

  // -------------------------
  // Update answer for player (authoritative)
  // -------------------------
  static async updateAnswer(playerId, answer) {
    if (quizState.answerLocked) return;

    const q = quizState.questions[quizState.currentQuestionIndex];
    if (!q) return;

    // Validate answer strictly
    if (q.type === "MCQ") {
      if (typeof answer !== "number" || !Number.isInteger(answer) || answer < 0 || answer >= q.options.length) {
        return;
      }
    } else {
      if (typeof answer !== "string") return;
    }

    // Rate limit answer updates
    const now = Date.now();
    const last = quizState.lastAnswerTime[playerId] || 0;
    if (now - last < 200) return;

    quizState.lastAnswerTime[playerId] = now;
    quizState.currentAnswers[playerId] = answer;

    try {
      await quizRepository.saveState(quizState);
    } catch (err) {
      console.error("❌ Failed to save state on updateAnswer:", err);
    }
  }

  // -------------------------
  // Build state for clients / REST
  // -------------------------
  static buildState() {
    const q = quizState.questions[quizState.currentQuestionIndex];
    let remainingTime = 0;

    if (quizState.questionEndTime) {
      remainingTime = Math.max(0, Math.ceil((quizState.questionEndTime - Date.now()) / 1000));
    }

    return {
      status: quizState.status,
      players: Object.values(quizState.players),
      currentQuestionIndex: quizState.currentQuestionIndex,
      totalQuestions: quizState.questions.length,
      quizStartTime: quizState.quizStartTime,
      quizEndTime: quizState.quizEndTime,
      currentQuestion:
        quizState.answerLocked || !q
          ? q
          : { ...q, correctIndex: undefined, correctAnswer: undefined },
      remainingTime,
      answerHistory: quizState.answerHistory,
      participantLink: quizState.participantLink || null,
      linkExpiry: quizState.linkExpiry || null,
    };
  }

  // -------------------------
  // Clear timers (for graceful shutdown)
  // -------------------------
  static clearTimers() {
    if (quizState.timer) {
      clearTimeout(quizState.timer);
      quizState.timer = null;
    }
  }

  // -------------------------
  // Helper Methods for Admin REST
  // -------------------------
  static getStatus() {
    return quizState.status;
  }

  static async addQuestion(io, qData) {
    const newQ = {
      id: uuidv4(),
      prompt: qData.prompt,
      type: qData.type,
      options: Array.isArray(qData.options) ? qData.options : [],
      correctIndex: qData.correctIndex || 0,
      correctAnswer: qData.correctAnswer || "",
      timeLimit: qData.timeLimit || 15,
      score: qData.score || 100,
      negativeScore: qData.negativeScore || 0,
    };

    quizState.questions.push(newQ);
    this.computeTimeline(true);

    await quizRepository.saveState(quizState);
    io.emit("quiz_state", this.buildState());
    return newQ;
  }

  static async updateQuestion(io, id, updates) {
    const q = quizState.questions.find((q) => q.id === id);
    if (!q) return null;

    Object.assign(q, updates);
    this.computeTimeline(true);

    await quizRepository.saveState(quizState);
    io.emit("quiz_state", this.buildState());
    return q;
  }

  static async deleteQuestion(io, id) {
    const index = quizState.questions.findIndex((q) => q.id === id);
    if (index === -1) return false;

    quizState.questions.splice(index, 1);
    this.computeTimeline(true);

    await quizRepository.saveState(quizState);
    io.emit("quiz_state", this.buildState());
    return true;
  }

  static getAllPlayers() {
    return Object.values(quizState.players);
  }
}

module.exports = QuizEngine;
