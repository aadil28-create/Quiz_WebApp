// src/tests/quizState.integration.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import quizState from "../../../backend/quizState";

describe("quizState Integration Test", () => {
  beforeEach(() => {
    quizState.reset();
  });

  it("should start in WAITING state", () => {
    expect(quizState.status).toBe("WAITING");
    expect(quizState.currentQuestionIndex).toBe(-1);
    expect(Object.keys(quizState.players)).toHaveLength(0);
    expect(quizState.questions).toHaveLength(0);
    expect(quizState.isLinkValid()).toBe(false);
  });

  it("should allow host to join and set hostId", () => {
    const hostId = "host-123";
    quizState.hostId = hostId;
    quizState.players[hostId] = { id: hostId, name: "Admin", score: 0, socketId: null };
    
    expect(quizState.hostId).toBe(hostId);
    expect(quizState.getPlayer(hostId)?.name).toBe("Admin");
  });

  it("should allow participants to join", () => {
    const playerId = "p1";
    quizState.players[playerId] = { id: playerId, name: "Alice", score: 0, socketId: "socket-1" };
    
    expect(quizState.getPlayer(playerId)?.name).toBe("Alice");
    expect(Object.keys(quizState.players)).toContain(playerId);
  });

  it("should activate and validate shareable link", () => {
    const expiry = Date.now() + 1000 * 60; // 1 min in future
    quizState.activateLink(expiry, "link-uuid");

    expect(quizState.linkActive).toBe(true);
    expect(quizState.participantLink).toBe("link-uuid");
    expect(quizState.isLinkValid()).toBe(true);
  });

  it("should expire shareable link after timestamp", () => {
    const expiry = Date.now() - 1000; // expired
    quizState.activateLink(expiry, "link-uuid");
    expect(quizState.isLinkValid()).toBe(false);
  });

  it("should progress quiz questions correctly", () => {
    quizState.questions = [
      { id: "q1", text: "Q1", options: ["A","B"], correctIndex: 0, timeLimit: 10 },
      { id: "q2", text: "Q2", options: ["A","B"], correctIndex: 1, timeLimit: 15 },
    ];

    quizState.status = "LIVE";
    quizState.currentQuestionIndex = 0;

    // Move to next question
    quizState.currentQuestionIndex++;
    expect(quizState.getCurrentQuestion()?.id).toBe("q2");

    // Finish quiz
    quizState.currentQuestionIndex++;
    if (quizState.currentQuestionIndex >= quizState.questions.length) {
      quizState.status = "FINISHED";
    }
    expect(quizState.hasLiveQuiz()).toBe(false);
    expect(quizState.status).toBe("FINISHED");
  });

  it("should lock answers when questionEndTime passed or answerLocked true", () => {
    quizState.answerLocked = true;
    expect(quizState.isAnswerLocked()).toBe(true);

    quizState.answerLocked = false;
    quizState.questionEndTime = Date.now() - 1000;
    expect(quizState.isAnswerLocked()).toBe(true);

    quizState.questionEndTime = Date.now() + 1000;
    expect(quizState.isAnswerLocked()).toBe(false);
  });
});
