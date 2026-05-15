/**
 * Tests for session-status tracking events (Task 03).
 *
 * Covers:
 * - buildPromptSubmitPayload: correct shape, query truncation, missing prompt
 * - buildToolCompletePayload: correct shape, different tool names
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  buildPromptSubmitPayload,
  buildToolCompletePayload,
} from "../src/events.js";

// ---------------------------------------------------------------------------
// buildPromptSubmitPayload
// ---------------------------------------------------------------------------
describe("buildPromptSubmitPayload", () => {
  const ctx = {
    cwd: "/home/user/my-project",
    sessionManager: { getSessionFile: () => "/path/to/session.jsonl" },
  };

  beforeEach(() => {
    process.env.WARP_CLI_AGENT_PROTOCOL_VERSION = "1";
  });

  afterEach(() => {
    delete process.env.WARP_CLI_AGENT_PROTOCOL_VERSION;
  });

  it("produces correct payload with all fields and truncated query", () => {
    const payload = buildPromptSubmitPayload(ctx, "hello world");

    expect(payload).toEqual({
      v: 1,
      agent: "pi",
      event: "prompt_submit",
      session_id: "/path/to/session.jsonl",
      cwd: "/home/user/my-project",
      project: "my-project",
      query: "hello world",
    });
  });

  it("truncates query to 200 characters when over limit", () => {
    const longQuery = "q".repeat(250);
    const payload = buildPromptSubmitPayload(ctx, longQuery);

    expect((payload.query as string).length).toBe(200);
    expect((payload.query as string).endsWith("...")).toBe(true);
  });

  it("does not truncate query exactly at 200 characters", () => {
    const exactQuery = "a".repeat(200);
    const payload = buildPromptSubmitPayload(ctx, exactQuery);

    expect(payload.query).toBe(exactQuery);
    expect((payload.query as string).length).toBe(200);
  });

  it("handles empty prompt gracefully", () => {
    const payload = buildPromptSubmitPayload(ctx, "");

    expect(payload.query).toBe("");
  });

  it("handles missing prompt (undefined) gracefully", () => {
    const payload = buildPromptSubmitPayload(ctx, undefined);

    expect(payload.query).toBe("");
  });

  it("includes all base payload fields", () => {
    const payload = buildPromptSubmitPayload(ctx, "test");

    expect(payload.v).toBe(1);
    expect(payload.agent).toBe("pi");
    expect(payload.event).toBe("prompt_submit");
    expect(payload.session_id).toBe("/path/to/session.jsonl");
    expect(payload.cwd).toBe("/home/user/my-project");
    expect(payload.project).toBe("my-project");
  });
});

// ---------------------------------------------------------------------------
// buildToolCompletePayload
// ---------------------------------------------------------------------------
describe("buildToolCompletePayload", () => {
  const ctx = {
    cwd: "/home/user/project",
    sessionManager: { getSessionFile: () => "/s.jsonl" },
  };

  beforeEach(() => {
    process.env.WARP_CLI_AGENT_PROTOCOL_VERSION = "1";
  });

  afterEach(() => {
    delete process.env.WARP_CLI_AGENT_PROTOCOL_VERSION;
  });

  it("produces correct payload with tool_name for bash", () => {
    const payload = buildToolCompletePayload(ctx, "bash");

    expect(payload).toEqual({
      v: 1,
      agent: "pi",
      event: "tool_complete",
      session_id: "/s.jsonl",
      cwd: "/home/user/project",
      project: "project",
      tool_name: "bash",
    });
  });


});
