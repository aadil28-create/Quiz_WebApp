// src/tests/Index.test.tsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Index from "@/pages/Index";
import { BrowserRouter } from "react-router-dom";
import { vi, describe, it, expect, beforeEach } from "vitest";

//
// CRITICAL: mock the EXACT import path used by Index.tsx
//
vi.mock("@/components/navigation/NavCard", () => ({
  default: ({ title, to }: any) => (
    <a href={to} data-testid={`mock-navcard-${title}`}>
      {title}
    </a>
  ),
}));

describe("Index Page", () => {
  const renderPage = () =>
    render(
      <BrowserRouter>
        <Index />
      </BrowserRouter>
    );

  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.classList.remove("dark");
    localStorage.clear();
  });

  it("renders header and nav cards", () => {
    renderPage();

    // Header
    expect(screen.getByText("QuizLive")).toBeInTheDocument();
    expect(
      screen.getByText("Real-time interactive quizzes")
    ).toBeInTheDocument();

    // Nav cards via mock
    expect(
      screen.getByTestId("mock-navcard-Host Dashboard")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("mock-navcard-Join as Participant")
    ).toBeInTheDocument();
  });

  it("toggles theme correctly", () => {
    renderPage();

    const toggleBtn = screen.getByRole("button");

    expect(toggleBtn).toHaveTextContent("Dark Mode");

    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveTextContent("Light Mode");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    fireEvent.click(toggleBtn);

    expect(toggleBtn).toHaveTextContent("Dark Mode");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
