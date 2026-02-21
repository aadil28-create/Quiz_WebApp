# Frontend Documentation – QuizLive

## Overview
This documentation covers the frontend components and pages of QuizLive, including props, expected behavior, and recommended usage. All components are built with **React + TypeScript** and styled using **TailwindCSS**.

---

## Pages

### Index Page
- **Path:** `/src/pages/Index.tsx`
- **Purpose:** Landing page offering navigation to host dashboard or participant quiz.
- **Key Components:**
  - `NavCard` – reusable card for navigation links.
- **Notes:**
  - Lazy loads icons from `lucide-react`.
  - Includes light/dark mode toggle stored in `localStorage`.

### Login Panel
- **Path:** `/components/quiz/LoginPanel.tsx`
- **Props:**
  - `onLogin(name: string)` – callback after successful login.
  - `role: "host" | "participant"` – determines the fields and validation.
- **Behavior:** 
  - Validates name and, for hosts, password.
  - Accessible with proper ARIA attributes.
  
### NotFound Page
- **Path:** `/pages/NotFound.tsx`
- **Purpose:** Displayed for unmatched routes (404).
- **Props:** None.
- **Features:** 
  - Shows requested path.
  - Return link to home.
  - Logs 404 errors in dev mode.

---

## Components

### QuestionForm
- **Path:** `/components/quiz/QuestionForm.tsx`
- **Props:**
  - `initial?: Question` – prefill form for editing.
  - `onSave(q: Question)` – callback for saving.
  - `onCancel()` – cancels form.
- **Behavior:** Validates question text, options, correct answer, and time limit.

### QuestionList
- **Path:** `/components/quiz/QuestionList.tsx`
- **Props:**
  - `questions?: Question[]`
  - `onEdit(id: string)`
  - `onDelete(id: string)`
- **Behavior:** Displays a list with edit/delete buttons. Confirms deletion.

### OptionButton
- **Path:** `/components/quiz/OptionsButton.tsx`
- **Props:**
  - `label`, `index`, `selected`, `disabled`, `state`, `onClick`
- **Behavior:** Dynamically shows option letters, supports selected/correct/incorrect states, accessible.

### ScoreTable
- **Path:** `/components/quiz/ScoreTable.tsx`
- **Props:**
  - `participants?: Participant[]`
- **Behavior:** Renders leaderboard, sorts participants by score, highlights top positions.

### Timer
- **Path:** `/components/quiz/Timer.tsx`
- **Props:**
  - `seconds`, `maxSeconds`, `onTimeout?`
- **Behavior:** Progress bar countdown with visual urgency indicator.

---

## Testing & Mocks
- All components have corresponding mocks under `/components/quiz/mocks/`.
- Tests use **Vitest** with **React Testing Library**.
- Mock components are simplified, deterministic, and fully testable.

---

## Styling
- TailwindCSS + custom classes for shadows, hover states, and color variants.
- Consistent `font-display` for headings and `text-foreground`/`text-muted-foreground` for accessibility.

---

## Notes
- All interactive elements have ARIA attributes.
- Components follow a **mobile-first design** and are responsive.
- Time-sensitive elements (Timer, Quiz) are animated smoothly using Tailwind `transition` utilities.

