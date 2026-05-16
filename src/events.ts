/**
 * Notification event builders for Warp.
 *
 * Each function produces a complete payload ready for sendNotification().
 */

import { buildBasePayload } from "./payload.js";

const MAX_FIELD_LENGTH = 200;
const MAX_PREVIEW_LENGTH = 120;

/**
 * Truncate a string to maxLen characters, appending "..." when truncated.
 */
export function truncate(str: string, maxLen: number = MAX_FIELD_LENGTH): string {
  if (!str || str.length <= maxLen) return str || "";
  return str.slice(0, maxLen - 3) + "...";
}

// ---------------------------------------------------------------------------
// Prompt Submit (before_agent_start)
// ---------------------------------------------------------------------------

/**
 * Build a `prompt_submit` payload with the user's prompt text.
 */
export function buildPromptSubmitPayload(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
  prompt: string | undefined
): Record<string, unknown> {
  return {
    ...buildBasePayload("prompt_submit", ctx),
    query: truncate(prompt ?? ""),
  };
}

// ---------------------------------------------------------------------------
// Tool Complete (tool_execution_end)
// ---------------------------------------------------------------------------

/**
 * Build a `tool_complete` payload with the tool name.
 */
export function buildToolCompletePayload(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
  toolName: string
): Record<string, unknown> {
  return {
    ...buildBasePayload("tool_complete", ctx),
    tool_name: toolName,
  };
}

// ---------------------------------------------------------------------------
// Session Start
// ---------------------------------------------------------------------------

/**
 * Build a `session_start` payload with the plugin version.
 */
export function buildSessionStartPayload(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
  pluginVersion: string
): Record<string, unknown> {
  return {
    ...buildBasePayload("session_start", ctx),
    plugin_version: pluginVersion,
  };
}

// ---------------------------------------------------------------------------
// Agent End / Stop
// ---------------------------------------------------------------------------

/**
 * Build a `stop` payload with the last user query and last assistant response.
 */
export function buildStopPayload(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
  messages: Array<{ role: string; content: string | Array<{ type: string; text: string }> }>
): Record<string, unknown> {
  // Extract last user query
  let query = "";
  for (const msg of messages) {
    if (msg.role === "user") {
      if (typeof msg.content === "string") {
        query = msg.content;
      } else if (Array.isArray(msg.content)) {
        query = msg.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("");
      }
    }
  }
  query = truncate(query);

  // Extract last assistant response (iterate backwards)
  let response = "";
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      const textParts = msg.content
        .filter((b) => b.type === "text")
        .map((b) => b.text);
      if (textParts.length > 0) {
        response = textParts.join("");
        break;
      }
    }
  }
  response = truncate(response);

  return {
    ...buildBasePayload("stop", ctx),
    query,
    response,
  };
}


/**
 * Build a `permission_request` payload with a human-readable summary.
 */
export function buildPermissionRequestPayload(
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } },
  toolName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  const preview = buildPreview(toolName, input);

  return {
    ...buildBasePayload("permission_request", ctx),
    summary: `Wants to run ${toolName}: ${preview}`,
    tool_name: toolName,
    tool_input: input,
  };
}

/**
 * Build a short preview of the tool input for the summary string.
 */
function buildPreview(
  toolName: string,
  input: Record<string, unknown>
): string {
  let raw: string;

  if (typeof input.command === "string") {
    raw = input.command;
  } else if (typeof input.file_path === "string") {
    raw = input.file_path;
  } else if (typeof input.path === "string") {
    raw = input.path;
  } else {
    raw = JSON.stringify(input).slice(0, MAX_PREVIEW_LENGTH);
  }

  return truncate(raw, MAX_PREVIEW_LENGTH);
}
