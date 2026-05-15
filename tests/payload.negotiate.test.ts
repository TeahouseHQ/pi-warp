import { describe, it, expect, afterEach } from "vitest";
import {
  negotiateProtocolVersion,
  PLUGIN_CURRENT_PROTOCOL_VERSION,
} from "../src/payload.js";

describe("negotiateProtocolVersion", () => {
  const originalEnv = process.env;

  function setEnv(vars: Record<string, string | undefined>) {
    process.env = { ...originalEnv };
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
  }

  it("returns 1 when WARP_CLI_AGENT_PROTOCOL_VERSION is not set", () => {
    setEnv({ WARP_CLI_AGENT_PROTOCOL_VERSION: undefined });
    expect(negotiateProtocolVersion()).toBe(1);
  });

  it("returns plugin version when warp declares a higher version", () => {
    setEnv({ WARP_CLI_AGENT_PROTOCOL_VERSION: "99" });
    expect(negotiateProtocolVersion()).toBe(PLUGIN_CURRENT_PROTOCOL_VERSION);
  });

  it("returns warp version when warp declares a lower version", () => {
    setEnv({ WARP_CLI_AGENT_PROTOCOL_VERSION: "0" });
    expect(negotiateProtocolVersion()).toBe(0);
  });

  it("returns plugin version when warp declares the same version", () => {
    setEnv({ WARP_CLI_AGENT_PROTOCOL_VERSION: String(PLUGIN_CURRENT_PROTOCOL_VERSION) });
    expect(negotiateProtocolVersion()).toBe(PLUGIN_CURRENT_PROTOCOL_VERSION);
  });

  it("returns 1 when env var is not a number (NaN)", () => {
    setEnv({ WARP_CLI_AGENT_PROTOCOL_VERSION: "abc" });
    expect(negotiateProtocolVersion()).toBe(1);
  });

  afterEach(() => {
    process.env = originalEnv;
  });
});
