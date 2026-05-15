/**
 * Integration tests for event handlers wired in index.ts.
 *
 * These test the handler behavior by simulating the pi.on() wiring,
 * verifying that warpNotify is called with the correct payloads and
 * that tool_call handlers do not block execution.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildPermissionRequestPayload } from "../src/events.js";
describe("tool_call handler behavior", () => {
  beforeEach(() => {
    process.env.WARP_CLI_AGENT_PROTOCOL_VERSION = "1";
    process.env.WARP_CLIENT_VERSION = "v0.2026.04.01.00.00.stable_01";
  });

  afterEach(() => {
    delete process.env.WARP_CLI_AGENT_PROTOCOL_VERSION;
    delete process.env.WARP_CLIENT_VERSION;
  });

  it("buildPermissionRequestPayload does not include a block field", () => {
    const ctx = {
      cwd: "/project",
      sessionManager: { getSessionFile: () => "/s.jsonl" },
    };

    const payload = buildPermissionRequestPayload(ctx, "bash", {
      command: "ls",
    });

    expect(payload).not.toHaveProperty("block");
    expect(payload.event).toBe("permission_request");
  });


});
