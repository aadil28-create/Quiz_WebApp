import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import { describe, it, expect } from "vitest";

describe("NotFound component", () => {
  it("renders default 404 message with path", () => {
    // Provide initial entry so useLocation() returns /mock-path
    render(
      <MemoryRouter initialEntries={["/mock-path"]}>
        <NotFound />
      </MemoryRouter>
    );

    // Main container
    expect(screen.getByTestId("mock-notfound")).toBeInTheDocument();

    // Heading
    expect(screen.getByTestId("mock-notfound-heading")).toHaveTextContent("404");

    // Default path from router location
    expect(screen.getByTestId("mock-notfound-path")).toHaveTextContent("/mock-path");

    // Message container
    expect(screen.getByTestId("mock-notfound-message")).toBeInTheDocument();

    // Return link
    const link = screen.getByTestId("mock-notfound-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders custom path if provided", () => {
    const customPath = "/some/random/page";

    render(
      <MemoryRouter initialEntries={[customPath]}>
        <NotFound path={customPath} />
      </MemoryRouter>
    );

    // Ensure the custom path is displayed
    expect(screen.getByTestId("mock-notfound-path")).toHaveTextContent(customPath);

    // Heading and link sanity check
    expect(screen.getByTestId("mock-notfound-heading")).toHaveTextContent("404");
    expect(screen.getByTestId("mock-notfound-link")).toBeInTheDocument();
    expect(screen.getByTestId("mock-notfound-link")).toHaveAttribute("href", "/");
  });
});
