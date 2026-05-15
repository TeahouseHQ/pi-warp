import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { warpNotify } from "./src/osc.js";
import { shouldUseStructured } from "./src/version.js";
import {
  buildSessionStartPayload,
  buildStopPayload,
  buildPermissionRequestPayload,
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

export default function (pi: ExtensionAPI) {
  // -----------------------------------------------------------------------
  // Hook 1: Notify Warp when user submits a prompt and agent starts working
  // -----------------------------------------------------------------------
  pi.on("before_agent_start", async (event, ctx) => {
    if (!shouldUseStructured()) return;

    const payload = buildPromptSubmitPayload(ctx, event.prompt);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 2: Notify Warp when the agent completes its work
  // -----------------------------------------------------------------------
  pi.on("agent_end", async (event, ctx) => {
    if (!shouldUseStructured()) return;

    const payload = buildStopPayload(ctx, event.messages);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 3: Session start — emit structured payload with plugin version
  // -----------------------------------------------------------------------
  pi.on("session_start", async (_event, ctx) => {
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
  pi.on("tool_execution_end", async (event, ctx) => {
    if (!shouldUseStructured()) return;

    const payload = buildToolCompletePayload(ctx, event.toolName);
    warpNotify(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 5: Tool call — emit permission_request notification (informational)
  // -----------------------------------------------------------------------
  pi.on("tool_call", async (event, ctx) => {
    if (!shouldUseStructured()) return;

    const payload = buildPermissionRequestPayload(
      ctx,
      event.toolName,
      event.input as Record<string, unknown>
    );
    warpNotify(payload);
    // Do NOT return { block: true } — notification only
  });
}
