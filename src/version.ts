/**
 * Broken-version detection for Warp builds.
 */

/**
 * Known broken thresholds per channel — builds at or below these don't support
 * structured CLI agent notifications.
 */
const BROKEN_THRESHOLDS: Record<string, string> = {
  stable: "v0.2026.03.25.08.24.stable_05",
  preview: "v0.2026.03.25.08.24.preview_05",
};

/**
 * Extract the channel from a Warp version string.
 * Returns "dev", "stable", "preview", or undefined if unrecognized.
 */
function extractChannel(version: string): string | undefined {
  if (version.includes("dev")) return "dev";
  if (version.includes("stable")) return "stable";
  if (version.includes("preview")) return "preview";
  return undefined;
}

/**
 * Check if the current Warp build supports structured CLI agent notifications.
 * Returns false if required env vars are missing or the client version is at or
 * below the last known broken release for its channel.
 */
export function shouldUseStructured(): boolean {
  if (!process.env.WARP_CLI_AGENT_PROTOCOL_VERSION) return false;
  if (!process.env.WARP_CLIENT_VERSION) return false;

  const clientVersion = process.env.WARP_CLIENT_VERSION;
  const channel = extractChannel(clientVersion);

  // dev was never broken, unrecognized channels are assumed OK
  if (!channel || channel === "dev") return true;

  const threshold = BROKEN_THRESHOLDS[channel];
  if (!threshold) return true;

  // Compare lexicographically — Warp version strings sort correctly
  return clientVersion > threshold;
}
