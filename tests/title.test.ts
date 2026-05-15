/**
 * Tests for OSC 0 terminal title management (src/title.ts).
 *
 * Covers:
 * - formatOsc0: correct escape sequence
 * - buildTitle: static title construction (with/without custom session name)
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
  it("includes session name when user has set one", () => {
    const ctx = {
      cwd: "/home/user/my-app",
      sessionManager: {
        getSessionFile: () => "/sessions/abc123.jsonl",
        getSessionName: () => "Refactor auth",
      },
    };

    expect(buildTitle(ctx)).toBe("π Refactor auth — my-app");
  });

  it("omits session when no custom name (auto-generated)", () => {
    const ctx = {
      cwd: "/home/user/project",
      sessionManager: {
        getSessionFile: () => "/sessions/2026-05-14T04-44-13_019e24cc.jsonl",
        getSessionName: () => undefined,
      },
    };

    expect(buildTitle(ctx)).toBe("π — project");
  });

  it("omits session when getSessionName returns empty string", () => {
    const ctx = {
      cwd: "/home/user/project",
      sessionManager: {
        getSessionFile: () => "/sessions/abc.jsonl",
        getSessionName: () => "",
      },
    };

    expect(buildTitle(ctx)).toBe("π — project");
  });

  it("handles empty cwd", () => {
    const ctx = {
      cwd: "",
      sessionManager: {
        getSessionFile: () => "/sessions/s.jsonl",
        getSessionName: () => undefined,
      },
    };

    expect(buildTitle(ctx)).toBe("π — ");
  });

  it("shows session name with empty cwd", () => {
    const ctx = {
      cwd: "",
      sessionManager: {
        getSessionFile: () => "/sessions/s.jsonl",
        getSessionName: () => "My Session",
      },
    };

    expect(buildTitle(ctx)).toBe("π My Session — ");
  });
});

// ---------------------------------------------------------------------------
// startSpinner / stopSpinner lifecycle
// ---------------------------------------------------------------------------
describe("spinner lifecycle", () => {
  const ctx = {
    cwd: "/home/user/project",
    sessionManager: {
      getSessionFile: () => "/sess/abc.jsonl",
      getSessionName: () => undefined,
    },
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
