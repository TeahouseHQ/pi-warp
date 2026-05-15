import { describe, it, expect } from "vitest";
import { formatOsc777 } from "../src/osc.js";

describe("formatOsc777", () => {
  it("produces the exact expected escape sequence", () => {
    const payload = { v: 1, agent: "pi", event: "stop" };
    const result = formatOsc777(payload);

    expect(result).toBe(
      `\x1b]777;notify;warp://cli-agent;${JSON.stringify(payload)}\x07`
    );
  });

  it("starts with OSC 777 escape", () => {
    const result = formatOsc777({ test: true });
    expect(result.startsWith("\x1b]777;notify;warp://cli-agent;")).toBe(true);
  });

  it("ends with BEL character", () => {
    const result = formatOsc777({ test: true });
    expect(result.endsWith("\x07")).toBe(true);
  });

  it("contains valid JSON in the body", () => {
    const result = formatOsc777({ v: 1, data: "hello" });
    const jsonPart = result.slice(
      result.indexOf("warp://cli-agent;") + "warp://cli-agent;".length,
      -1 // remove BEL
    );
    expect(() => JSON.parse(jsonPart)).not.toThrow();
    expect(JSON.parse(jsonPart)).toEqual({ v: 1, data: "hello" });
  });
});
