import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { shouldUseStructured } from "../src/version.js";

describe("shouldUseStructured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function setEnv(vars: Record<string, string | undefined>) {
    for (const [k, v] of Object.entries(vars)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  it("returns false when WARP_CLI_AGENT_PROTOCOL_VERSION is not set", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: undefined,
      WARP_CLIENT_VERSION: "v0.2026.04.01.00.00.stable_01",
    });
    expect(shouldUseStructured()).toBe(false);
  });

  it("returns false when WARP_CLIENT_VERSION is not set", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: undefined,
    });
    expect(shouldUseStructured()).toBe(false);
  });

it("returns true for dev versions", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.04.01.00.00.dev_01",
    });
    expect(shouldUseStructured()).toBe(true);
  });

  it("returns false for exact broken stable version", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.24.stable_05",
    });
    expect(shouldUseStructured()).toBe(false);
  });

  it("returns false for version older than broken stable", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.24.stable_04",
    });
    expect(shouldUseStructured()).toBe(false);
  });

  it("returns true for newer stable version", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.25.stable_01",
    });
    expect(shouldUseStructured()).toBe(true);
  });

  it("returns false for exact broken preview version", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.24.preview_05",
    });
    expect(shouldUseStructured()).toBe(false);
  });

  it("returns false for version older than broken preview", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.24.preview_04",
    });
    expect(shouldUseStructured()).toBe(false);
  });

  it("returns true for newer preview version", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.25.preview_01",
    });
    expect(shouldUseStructured()).toBe(true);
  });

  it("returns true for unrecognized channel suffix", () => {
    setEnv({
      WARP_CLI_AGENT_PROTOCOL_VERSION: "1",
      WARP_CLIENT_VERSION: "v0.2026.03.25.08.24.beta_01",
    });
    expect(shouldUseStructured()).toBe(true);
  });
});
