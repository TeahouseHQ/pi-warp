/**
 * Extension settings — persisted in pi global settings.
 *
 * Settings are stored under the `piWarp` key in
 * `~/.pi/agent/settings.json` so they survive restarts.
 *
 * Schema:
 *   piWarp.dynamicTitles: boolean  (default: true)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ---------------------------------------------------------------------------
// Settings schema
// ---------------------------------------------------------------------------

export interface WarpNotifySettings {
  /** Animate terminal title while agent is working. Default: true */
  dynamicTitles: boolean;
}

const DEFAULTS: WarpNotifySettings = {
  dynamicTitles: true,
};

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

/** @internal Test override for the settings file path */
export let _settingsPathOverride: string | undefined;

/** @internal Set the override (used by tests) */
export function setSettingsPathOverride(value: string | undefined): void {
  _settingsPathOverride = value;
}

function settingsPath(): string {
  return _settingsPathOverride ?? join(homedir(), ".pi", "agent", "settings.json");
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

function readGlobalSettings(): Record<string, unknown> {
  const path = settingsPath();
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeGlobalSettings(settings: Record<string, unknown>): void {
  const path = settingsPath();
  writeFileSync(path, JSON.stringify(settings, null, 2) + "\n", "utf-8");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load the piWarp settings from pi global settings.
 * Returns a full settings object with defaults applied.
 */
export function loadSettings(): WarpNotifySettings {
  const global = readGlobalSettings();
  const ext = (global.piWarp ?? {}) as Partial<WarpNotifySettings>;

  return {
    dynamicTitles: ext.dynamicTitles ?? DEFAULTS.dynamicTitles,
  };
}

/**
 * Persist a single setting key under the `piWarp` namespace.
 * Merges with existing piWarp settings so sibling keys are preserved.
 */
export function saveSetting<K extends keyof WarpNotifySettings>(
  key: K,
  value: WarpNotifySettings[K],
): void {
  const global = readGlobalSettings();
  const current = (global.piWarp ?? {}) as Record<string, unknown>;
  current[key] = value;
  global.piWarp = current;
  writeGlobalSettings(global);
}

/**
 * Convenience: check whether dynamic titles are enabled.
 */
export function dynamicTitlesEnabled(): boolean {
  return loadSettings().dynamicTitles;
}
