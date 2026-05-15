/**
 * Protocol version negotiation and payload builder.
 */

export const PLUGIN_CURRENT_PROTOCOL_VERSION = 1;

/**
 * Negotiate the protocol version with Warp.
 * Uses min(plugin_current, warp_declared), falling back to 1.
 */
export function negotiateProtocolVersion(): number {
  const warpVersion = parseInt(
    process.env.WARP_CLI_AGENT_PROTOCOL_VERSION ?? "1",
    10
  );
  if (isNaN(warpVersion)) return PLUGIN_CURRENT_PROTOCOL_VERSION;
  return Math.min(warpVersion, PLUGIN_CURRENT_PROTOCOL_VERSION);
}

/**
 * Build the common payload fields shared by all events.
 */
export function buildBasePayload(
  event: string,
  ctx: { cwd: string; sessionManager: { getSessionFile(): string | undefined } }
): Record<string, unknown> {
  const sessionFile = ctx.sessionManager.getSessionFile();
  const project = ctx.cwd ? ctx.cwd.split("/").pop() ?? "" : "";

  return {
    v: negotiateProtocolVersion(),
    agent: "pi",
    event,
    session_id: sessionFile ?? "",
    cwd: ctx.cwd,
    project,
  };
}
