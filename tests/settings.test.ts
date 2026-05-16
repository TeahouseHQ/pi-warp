/**
 * Tests for src/settings.ts — extension settings persistence.
 *
 * Covers:
 * - loadSettings returns defaults when no settings exist
 * - loadSettings returns stored values
 * - saveSetting persists a single key
 * - saveSetting merges with existing piWarp keys
 * - dynamicTitlesEnabled convenience function
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  loadSettings,
  saveSetting,
  dynamicTitlesEnabled,
} from "../src/settings.js";
import { setSettingsPathOverride } from "../src/settings.js";

// ---------------------------------------------------------------------------
// Helpers — redirect settings path via override
// ---------------------------------------------------------------------------

let tmpDir: string;

beforeEach(() => {
  tmpDir = path.join(os.tmpdir(), `pi-warp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(path.join(tmpDir, ".pi", "agent"), { recursive: true });
  setSettingsPathOverride(path.join(tmpDir, ".pi", "agent", "settings.json"));
});

afterEach(() => {
  setSettingsPathOverride(undefined);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// loadSettings
// ---------------------------------------------------------------------------
describe("loadSettings", () => {
  it("returns defaults when no settings file exists", () => {
    expect(loadSettings()).toEqual({ dynamicTitles: true });
  });

  it("returns defaults when file has no piWarp key", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ theme: "dark" }),
    );
    expect(loadSettings()).toEqual({ dynamicTitles: true });
  });

  it("returns stored dynamicTitles value", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ piWarp: { dynamicTitles: false } }),
    );
    expect(loadSettings()).toEqual({ dynamicTitles: false });
  });

  it("fills in default for missing keys", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ piWarp: {} }),
    );
    expect(loadSettings()).toEqual({ dynamicTitles: true });
  });

  it("handles malformed JSON gracefully", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      "not-json{",
    );
    expect(loadSettings()).toEqual({ dynamicTitles: true });
  });
});

// ---------------------------------------------------------------------------
// saveSetting
// ---------------------------------------------------------------------------
describe("saveSetting", () => {
  it("persists a single setting key", () => {
    saveSetting("dynamicTitles", false);

    const raw = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".pi", "agent", "settings.json"), "utf-8"),
    );
    expect(raw.piWarp.dynamicTitles).toBe(false);
  });

  it("merges with existing piWarp keys", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ piWarp: { dynamicTitles: true } }),
    );

    saveSetting("dynamicTitles", false);

    const raw = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".pi", "agent", "settings.json"), "utf-8"),
    );
    expect(raw.piWarp.dynamicTitles).toBe(false);
  });

  it("preserves sibling keys in global settings", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ theme: "dark", defaultProvider: "anthropic" }),
    );

    saveSetting("dynamicTitles", false);

    const raw = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".pi", "agent", "settings.json"), "utf-8"),
    );
    expect(raw.theme).toBe("dark");
    expect(raw.defaultProvider).toBe("anthropic");
    expect(raw.piWarp.dynamicTitles).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// dynamicTitlesEnabled
// ---------------------------------------------------------------------------
describe("dynamicTitlesEnabled", () => {
  it("returns true by default", () => {
    expect(dynamicTitlesEnabled()).toBe(true);
  });

  it("returns false when disabled", () => {
    fs.writeFileSync(
      path.join(tmpDir, ".pi", "agent", "settings.json"),
      JSON.stringify({ piWarp: { dynamicTitles: false } }),
    );
    expect(dynamicTitlesEnabled()).toBe(false);
  });
});
