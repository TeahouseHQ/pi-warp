import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { warpNotify } from "./src/osc.js";
import { shouldUseStructured } from "./src/version.js";
import {
  buildSessionStartPayload,
  buildStopPayload,
  buildPromptSubmitPayload,
  buildToolCompletePayload,
} from "./src/events.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Plugin version from package.json
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf-8")
);
const PLUGIN_VERSION: string = pkg.version;

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function (pi: ExtensionAPI): void {
  // -----------------------------------------------------------------------
  // Hook 1: Notify Warp when user submits a prompt and agent starts working
  // -----------------------------------------------------------------------
  pi.on("before_agent_start", async (event: { prompt?: string }, ctx: Parameters<typeof buildPromptSubmitPayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildPromptSubmitPayload(ctx, event.prompt);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 2: Notify Warp when the agent completes its work
  // -----------------------------------------------------------------------
  pi.on("agent_end", async (event: { messages: Parameters<typeof buildStopPayload>[1] }, ctx: Parameters<typeof buildStopPayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildStopPayload(ctx, event.messages);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 3: Session start — emit structured payload with plugin version
  // -----------------------------------------------------------------------
  pi.on("session_start", async (_event: unknown, ctx: Parameters<typeof buildSessionStartPayload>[0] & { ui: { notify(message: string, level: string): void } }) => {
    if (!shouldUseStructured()) {
      console.log(
        "[warp-notify] Warp not detected or structured notifications not supported."
      );
      return;
    }

    const payload = buildSessionStartPayload(ctx, PLUGIN_VERSION);
    warpNotify(payload);
    ctx.ui.notify("Warp notifications active ✓", "info");
  });

  // -----------------------------------------------------------------------
  // Hook 4: Tool execution end — emit tool_complete notification
  // -----------------------------------------------------------------------
  pi.on("tool_execution_end", async (event: { toolName: string }, ctx: Parameters<typeof buildToolCompletePayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildToolCompletePayload(ctx, event.toolName);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 5: DISABLED — permission_request is not wired to tool_call.
  // See README for details on deferred permission_request support.
  // -----------------------------------------------------------------------
}
