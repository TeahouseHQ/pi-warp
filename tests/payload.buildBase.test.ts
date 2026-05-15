import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { buildBasePayload } from "../src/payload.js";

describe("buildBasePayload", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, WARP_CLI_AGENT_PROTOCOL_VERSION: "1" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("produces the correct envelope with all common fields", () => {
    const ctx = {
      cwd: "/home/user/my-project",
      sessionManager: { getSessionFile: () => "/path/to/session.jsonl" },
    };

    const payload = buildBasePayload("prompt_submit", ctx);

    expect(payload).toEqual({
      v: 1,
      agent: "pi",
      event: "prompt_submit",
      session_id: "/path/to/session.jsonl",
      cwd: "/home/user/my-project",
      project: "my-project",
    });
  });

  it("handles missing session file gracefully (empty string)", () => {
    const ctx = {
      cwd: "/home/user/my-project",
      sessionManager: { getSessionFile: () => undefined },
    };

    const payload = buildBasePayload("stop", ctx);

    expect(payload.session_id).toBe("");
  });

  it("handles empty cwd gracefully", () => {
    const ctx = {
      cwd: "",
      sessionManager: { getSessionFile: () => "/session.jsonl" },
    };

    const payload = buildBasePayload("stop", ctx);

    expect(payload.project).toBe("");
    expect(payload.cwd).toBe("");
  });

  it("extracts project as basename of cwd", () => {
    const ctx = {
      cwd: "/a/b/c/my-app",
      sessionManager: { getSessionFile: () => "/s" },
    };

    const payload = buildBasePayload("session_start", ctx);

    expect(payload.project).toBe("my-app");
  });
});
