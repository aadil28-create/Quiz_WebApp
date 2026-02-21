# Quiz App Backend Documentation

## Overview
This backend implements a real-time quiz system with Socket.IO and REST endpoints.  
It maintains an authoritative in-memory state (`quizState`) persisted to disk (`quizRepository`).  
The main modules include Fastify for HTTP, Socket.IO for real-time communication, and a `QuizEngine` for quiz logic.

---

## 1. `server.js`
- Entry point for the backend.
- Responsibilities:
  - Loads environment variables.
  - Creates Fastify app (`app.js`).
  - Initializes Socket.IO (`socketServer.js`).
  - Registers admin routes.
  - Handles graceful shutdown.
- Exports: **none** (starts the server directly).

---

## 2. `app.js`
- Creates a production-ready Fastify instance.
- Registers middleware:
  - `@fastify/cors` (CORS)
  - `@fastify/helmet` (security headers)
  - `@fastify/compress` (gzip/deflate)
  - `@fastify/sensible` (error utilities)
- Sets strict JSON parser.
- Provides health check and optional quiz result endpoint.
- Returns: `FastifyInstance`.

---

## 3. `socketServer.js`
- Attaches Socket.IO to the Fastify server.
- Responsibilities:
  - Configure CORS for Socket.IO.
  - Load `socket.js` logic.
  - Provide REST endpoint for quiz results.
  - Graceful shutdown for Socket.IO.
- Returns: `io` (Socket.IO server instance).

---

## 4. `socket.js`
- Implements real-time quiz interactions over Socket.IO.
- Handles:
  - Player join (`join_quiz`).
  - Host login (`host_login`).
  - Question management (`add_question`, `update_question`, `delete_question`).
  - Quiz control (`start_quiz`).
  - Answer submission (`answer_update`).
  - Disconnects.
- Uses `QuizEngine` to manage quiz lifecycle.
- Ensures **authoritative state management** via `quizState`.

---

## 5. `QuizEngine.js`
- Core quiz logic (authoritative).
- Responsibilities:
  - Manage quiz lifecycle: `startQuiz`, `advanceIfNeeded`, `lockAnswers`, `finishQuiz`.
  - Compute question timelines.
  - Score questions and freeze answers.
  - Update answers (`updateAnswer`).
  - Admin helper methods:
    - `addQuestion(io, qData)`
    - `updateQuestion(io, id, updates)`
    - `deleteQuestion(io, id)`
    - `getAllPlayers()`
- Emits updated state to Socket.IO clients.

---

## 6. `quizState.js`
- In-memory authoritative quiz state.
- Structure:
  ```json
  {
    "status": "WAITING",
    "quizStartTime": null,
    "quizEndTime": null,
    "currentQuestionIndex": -1,
    "questionStartTime": null,
    "questionEndTime": null,
    "timer": null,
    "answerLocked": false,
    "hostId": null,
    "players": {},
    "questions": [],
    "currentAnswers": {},
    "answerHistory": {},
    "timeline": [],
    "lastUpdated": null
  }
Provides utility methods:

reset() – reset state for a new quiz.

touch() – update lastUpdated timestamp.


7. quizRepository.js
Persists quizState to disk in data/quizState.json.

Methods:

loadState() – load from disk or create default state.

saveState(state) – atomic write to disk.

clearState() – delete persisted state.

Ensures safe persistence with temporary file writes.


8. Routes
a) routes/adminQuizRoutes.js
Admin REST endpoints (require Basic Auth).

Endpoints:

POST /api/admin/start-quiz – start quiz (host only).

POST /api/admin/add-question – add new question.

PUT /api/admin/update-question – update question.

DELETE /api/admin/delete-question – delete question.

Uses QuizEngine for authoritative updates.

Rate-limited to 5 requests per second per IP.

b) routes/quizRoutes.js
Public quiz REST endpoints.

Endpoints:

GET /api/results – current scores of all players.

GET /api/quiz-state – full quiz state (timeline, questions, players, answer history).

Rate-limited to 10 requests per second per IP.


9. Directory Structure
backend/
│   .env
│   app.js
│   QuizEngine.js
│   quizRepository.js
│   quizState.js
│   server.js
│   socket.js
│   socketServer.js
│
└───routes
        adminQuizRoutes.js
        quizRoutes.js


10. Notes / Best Practices
quizState is the single source of truth; all updates must go through QuizEngine.

Socket.IO is authoritative: clients cannot update scores directly.

Admin REST endpoints should use secure credentials in production.

Always persist state using quizRepository to prevent data loss.

Timers and Socket.IO connections are not persisted and are reset on server restart.