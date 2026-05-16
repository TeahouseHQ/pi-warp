/**
 * OSC 0 — Dynamic Terminal Title.
 *
 * Working: ⠋ π session — project  (animated braille spinner)
 * Ready:  π session — project     (static, no spinner)
 */

import { writeFileSync } from "node:fs";

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 120;

let timer: ReturnType<typeof setInterval> | null = null;
let frameIndex = 0;

/**
 * Format an OSC 0 escape sequence to set the terminal window title.
 */
export function formatOsc0(title: string): string {
  return `\x1b]0;${title}\x07`;
}

/**
 * Write an OSC 0 title sequence to /dev/tty.
 * Silently ignores write failures.
 */
function setTitle(title: string): void {
  const seq = formatOsc0(title);
  try {
    writeFileSync("/dev/tty", seq);
  } catch {
    // Silently ignore if /dev/tty is not available
  }
}

/**
 * Build the static title string.
 *
 * With user-named session: "π My Session — project"
 * Without (auto-generated): "π — project"
 *
 * The session name is only included when the user has explicitly set one
 * via `/name` — default auto-generated sessions are omitted.
 */
export function buildTitle(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined; getSessionName?(): string | undefined } }
): string {
  const project = ctx.cwd ? ctx.cwd.split("/").pop() ?? "" : "";
  const sessionName = ctx.sessionManager.getSessionName?.();
  if (sessionName) {
    return `π ${sessionName} — ${project}`;
  }
  return `π — ${project}`;
}

/**
 * Start the animated spinner in the terminal title.
 * Call this when the agent begins working (before_agent_start).
 */
export function startSpinner(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined; getSessionName?(): string | undefined } }
): void {
  stopSpinner(); // clear any existing timer

  const base = buildTitle(ctx);

  timer = setInterval(() => {
    const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
    setTitle(`${frame} ${base}`);
    frameIndex++;
  }, SPINNER_INTERVAL_MS);
}

/**
 * Stop the animated spinner and set the static "ready" title.
 * Call this when the agent finishes (agent_end).
 */
export function stopSpinner(
  ctx?: { cwd: string; sessionManager: { getSessionFile(): string | undefined; getSessionName?(): string | undefined } }
): void {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  frameIndex = 0;

  if (ctx) {
    setTitle(buildTitle(ctx));
  }
}

/**
 * Check whether the spinner is currently active.
 */
export function isSpinnerActive(): boolean {
  return timer !== null;
}
