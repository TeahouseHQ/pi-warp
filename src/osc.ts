/**
 * OSC 777 emitter for Warp notifications.
 */

import { writeFileSync } from "node:fs";

/**
 * Format an OSC 777 escape sequence for a Warp notification payload.
 * Visible (testable) helper — the actual write goes through warpNotify().
 */
export function formatOsc777(payload: Record<string, unknown>): string {
  const body = JSON.stringify(payload);
  return `\x1b]777;notify;warp://cli-agent;${body}\x07`;
}

/**
 * Send a structured notification to Warp via OSC 777.
 * Written to /dev/tty so it reaches the controlling terminal directly.
 * Silently ignores write failures.
 */
export function warpNotify(payload: Record<string, unknown>): void {
  const seq = formatOsc777(payload);
  try {
    writeFileSync("/dev/tty", seq);
  } catch {
    // Silently ignore if /dev/tty is not available (e.g. piped mode)
  }
}
