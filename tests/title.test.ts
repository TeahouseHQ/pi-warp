/**
 * Tests for OSC 0 terminal title management (src/title.ts).
 *
 * Covers:
 * - formatOsc0: correct escape sequence
 * - buildTitle: static title construction
 * - startSpinner / stopSpinner: timer lifecycle
 * - isSpinnerActive: state query
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatOsc0,
  buildTitle,
  startSpinner,
  stopSpinner,
  isSpinnerActive,
} from "../src/title.js";

// ---------------------------------------------------------------------------
// formatOsc0
// ---------------------------------------------------------------------------
describe("formatOsc0", () => {
  it("produces correct OSC 0 escape sequence", () => {
    expect(formatOsc0("hello")).toBe("\x1b]0;hello\x07");
  });

  it("handles empty title", () => {
    expect(formatOsc0("")).toBe("\x1b]0;\x07");
  });

  it("handles title with special characters", () => {
    expect(formatOsc0("π session — project")).toBe(
      "\x1b]0;π session — project\x07"
    );
  });
});

// ---------------------------------------------------------------------------
// buildTitle
// ---------------------------------------------------------------------------
describe("buildTitle", () => {
  it("builds title from cwd basename and session file", () => {
    const ctx = {
      cwd: "/home/user/my-app",
      sessionManager: { getSessionFile: () => "/sessions/abc123.jsonl" },
    };

    expect(buildTitle(ctx)).toBe("π abc123 — my-app");
  });

  it("uses 'session' when no session file", () => {
    const ctx = {
      cwd: "/home/user/project",
      sessionManager: { getSessionFile: () => undefined },
    };

    expect(buildTitle(ctx)).toBe("π session — project");
  });

  it("handles session file without extension", () => {
    const ctx = {
      cwd: "/home/user/project",
      sessionManager: { getSessionFile: () => "/sessions/my-session" },
    };

    expect(buildTitle(ctx)).toBe("π my-session — project");
  });

  it("handles empty cwd", () => {
    const ctx = {
      cwd: "",
      sessionManager: { getSessionFile: () => "/sessions/s.jsonl" },
    };

    expect(buildTitle(ctx)).toBe("π s — ");
  });

  it("strips only last extension from session file", () => {
    const ctx = {
      cwd: "/home/user/app",
      sessionManager: { getSessionFile: () => "/sessions/archive.tar.gz" },
    };

    expect(buildTitle(ctx)).toBe("π archive.tar — app");
  });
});

// ---------------------------------------------------------------------------
// startSpinner / stopSpinner lifecycle
// ---------------------------------------------------------------------------
describe("spinner lifecycle", () => {
  const ctx = {
    cwd: "/home/user/project",
    sessionManager: { getSessionFile: () => "/sess/abc.jsonl" },
  };

  beforeEach(() => {
    vi.useFakeTimers();
    stopSpinner(); // ensure clean state
  });

  afterEach(() => {
    stopSpinner();
    vi.useRealTimers();
  });

  it("isSpinnerActive is false before startSpinner", () => {
    expect(isSpinnerActive()).toBe(false);
  });

  it("isSpinnerActive is true after startSpinner", () => {
    startSpinner(ctx);
    expect(isSpinnerActive()).toBe(true);
  });

  it("isSpinnerActive is false after stopSpinner", () => {
    startSpinner(ctx);
    stopSpinner(ctx);
    expect(isSpinnerActive()).toBe(false);
  });

  it("startSpinner clears previous timer (no double-timer)", () => {
    startSpinner(ctx);
    startSpinner(ctx); // second call should clear first
    expect(isSpinnerActive()).toBe(true);

    stopSpinner(ctx);
    expect(isSpinnerActive()).toBe(false);
  });

  it("stopSpinner without ctx just stops the timer (no title set)", () => {
    startSpinner(ctx);
    stopSpinner();
    expect(isSpinnerActive()).toBe(false);
  });
});
