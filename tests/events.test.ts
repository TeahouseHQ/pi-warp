import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  buildSessionStartPayload,
  buildStopPayload,
  buildPermissionRequestPayload,
  truncate,
} from "../src/events.js";

const MAX_FIELD = 200;

// ---------------------------------------------------------------------------
// truncate helper
// ---------------------------------------------------------------------------
describe("truncate", () => {
  it("returns the original string when under the limit", () => {
    expect(truncate("hello", 200)).toBe("hello");
  });

  it("returns the original string when exactly at the limit", () => {
    const s = "a".repeat(MAX_FIELD);
    expect(truncate(s, MAX_FIELD)).toBe(s);
  });

  it("truncates and appends '...' when over the limit", () => {
    const s = "a".repeat(MAX_FIELD + 10);
    const result = truncate(s, MAX_FIELD);
    expect(result.length).toBe(MAX_FIELD);
    expect(result.endsWith("...")).toBe(true);
  });

  it("handles empty string", () => {
    expect(truncate("", MAX_FIELD)).toBe("");
  });

  it("handles nullish string", () => {
    expect(truncate(null as unknown as string, MAX_FIELD)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildSessionStartPayload
// ---------------------------------------------------------------------------
describe("buildSessionStartPayload", () => {
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

  it("produces correct payload with all fields including plugin_version", () => {
    const payload = buildSessionStartPayload(ctx, "2.0.0");

    expect(payload).toEqual({
      v: 1,
      agent: "pi",
      event: "session_start",
      session_id: "/path/to/session.jsonl",
      cwd: "/home/user/my-project",
      project: "my-project",
      plugin_version: "2.0.0",
    });
  });

  it("handles missing session file gracefully", () => {
    const ctxNoSession = {
      cwd: "/home/user/my-project",
      sessionManager: { getSessionFile: () => undefined },
    };

    const payload = buildSessionStartPayload(ctxNoSession, "2.0.0");
    expect(payload.session_id).toBe("");
  });
});

// ---------------------------------------------------------------------------
// buildStopPayload
// ---------------------------------------------------------------------------
describe("buildStopPayload", () => {
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

  it("extracts last user query (string content) and last assistant response", () => {
    const messages = [
      { role: "user", content: "first question" },
      { role: "assistant", content: [{ type: "text", text: "first answer" }] },
      { role: "user", content: "second question" },
      { role: "assistant", content: [{ type: "text", text: "second answer" }] },
    ];

    const payload = buildStopPayload(ctx, messages);

    expect(payload.query).toBe("second question");
    expect(payload.response).toBe("second answer");
    expect(payload.event).toBe("stop");
  });

  it("extracts user query from array content with text blocks", () => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: "hello " },
          { type: "text", text: "world" },
        ],
      },
      { role: "assistant", content: [{ type: "text", text: "response" }] },
    ];

    const payload = buildStopPayload(ctx, messages);
    expect(payload.query).toBe("hello world");
  });

  it("truncates query and response at 200 chars", () => {
    const longQuery = "q".repeat(250);
    const longResponse = "r".repeat(300);
    const messages = [
      { role: "user", content: longQuery },
      { role: "assistant", content: [{ type: "text", text: longResponse }] },
    ];

    const payload = buildStopPayload(ctx, messages);

    expect(payload.query!.length).toBe(MAX_FIELD);
    expect(payload.query!.endsWith("...")).toBe(true);
    expect(payload.response!.length).toBe(MAX_FIELD);
    expect(payload.response!.endsWith("...")).toBe(true);
  });

  it("handles empty messages gracefully", () => {
    const payload = buildStopPayload(ctx, []);

    expect(payload.query).toBe("");
    expect(payload.response).toBe("");
  });

  it("joins multiple assistant text blocks", () => {
    const messages = [
      { role: "user", content: "hi" },
      {
        role: "assistant",
        content: [
          { type: "text", text: "part one " },
          { type: "text", text: "part two" },
        ],
      },
    ];

    const payload = buildStopPayload(ctx, messages);
    expect(payload.response).toBe("part one part two");
  });
});

// ---------------------------------------------------------------------------
// buildPermissionRequestPayload
// ---------------------------------------------------------------------------
describe("buildPermissionRequestPayload", () => {
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

  it("builds payload for bash tool with command preview", () => {
    const payload = buildPermissionRequestPayload(ctx, "bash", {
      command: "rm -rf /tmp/build",
    });

    expect(payload.event).toBe("permission_request");
    expect(payload.tool_name).toBe("bash");
    expect(payload.tool_input).toEqual({ command: "rm -rf /tmp/build" });
    expect(payload.summary).toBe("Wants to run bash: rm -rf /tmp/build");
  });

  it("builds payload for read tool with file_path", () => {
    const payload = buildPermissionRequestPayload(ctx, "read", {
      file_path: "/etc/config.yaml",
    });

    expect(payload.tool_name).toBe("read");
    expect(payload.summary).toBe("Wants to run read: /etc/config.yaml");
  });

  it("builds payload for edit tool with path fallback", () => {
    const payload = buildPermissionRequestPayload(ctx, "edit", {
      path: "/tmp/test.ts",
    });

    expect(payload.tool_name).toBe("edit");
    expect(payload.summary).toBe("Wants to run edit: /tmp/test.ts");
  });

  it("uses file_path over path when both present", () => {
    const payload = buildPermissionRequestPayload(ctx, "read", {
      file_path: "/primary",
      path: "/secondary",
    });

    expect(payload.summary).toBe("Wants to run read: /primary");
  });

  it("falls back to JSON.stringify for unknown tool input", () => {
    const payload = buildPermissionRequestPayload(ctx, "custom", {
      foo: "bar",
      baz: 42,
    });

    expect(payload.tool_name).toBe("custom");
    expect(payload.summary).toContain("Wants to run custom: ");
    expect(payload.summary!.length).toBeLessThanOrEqual(
      "Wants to run custom: ".length + 120
    );
  });

  it("truncates preview to 120 chars", () => {
    const longCmd = "x".repeat(200);
    const payload = buildPermissionRequestPayload(ctx, "bash", {
      command: longCmd,
    });

    // summary format: "Wants to run bash: <preview>"
    const prefix = "Wants to run bash: ";
    expect(payload.summary!.length).toBeLessThanOrEqual(prefix.length + 120);
  });

  it("includes all base payload fields", () => {
    const payload = buildPermissionRequestPayload(ctx, "bash", {
      command: "ls",
    });

    expect(payload.v).toBe(1);
    expect(payload.agent).toBe("pi");
    expect(payload.session_id).toBe("/s.jsonl");
    expect(payload.cwd).toBe("/home/user/project");
    expect(payload.project).toBe("project");
  });
});
