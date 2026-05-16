import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getSettingsListTheme } from "@earendil-works/pi-coding-agent";
import { Container, type SettingItem, SettingsList } from "@earendil-works/pi-tui";
import { sendNotification } from "./src/osc.js";
import { shouldUseStructured } from "./src/version.js";
import { startSpinner, stopSpinner } from "./src/title.js";
import {
  buildSessionStartPayload,
  buildStopPayload,
  buildPromptSubmitPayload,
  buildToolCompletePayload,
} from "./src/events.js";
import { loadSettings, saveSetting, type WarpNotifySettings } from "./src/settings.js";
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
  // /warp-settings command — toggle extension settings
  // -----------------------------------------------------------------------
  pi.registerCommand("pi-warp-settings", {
    description: "Configure pi-warp extension settings",
    handler: async (_args, ctx) => {
      const current = loadSettings();

      const items: SettingItem[] = [
        {
          id: "dynamicTitles",
          label: "Dynamic Terminal Titles",
          currentValue: current.dynamicTitles ? "on" : "off",
          values: ["on", "off"],
        },
      ];

      await ctx.ui.custom((_tui, theme, _kb, done) => {
        const container = new Container();
        container.addChild({
          render() {
            return [theme.fg("accent", theme.bold("pi-warp Settings")), ""];
          },
          invalidate() {},
        });

        const settingsList = new SettingsList(
          items,
          Math.min(items.length + 2, 15),
          getSettingsListTheme(),
          (id: string, newValue: string) => {
            const key = id as keyof WarpNotifySettings;
            if (key === "dynamicTitles") {
              const enabled = newValue === "on";
              saveSetting(key, enabled);
              ctx.ui.notify(
                `Dynamic titles ${enabled ? "enabled" : "disabled"}`,
                "info",
              );
            }
          },
          () => done(undefined),
        );

        container.addChild(settingsList);

        return {
          render: (w: number) => container.render(w),
          invalidate: () => container.invalidate(),
          handleInput: (data: string) => {
            settingsList.handleInput?.(data);
          },
        };
      });
    },
  });

  // -----------------------------------------------------------------------
  // Hook 1: Notify Warp when user submits a prompt and agent starts working
  // -----------------------------------------------------------------------
  pi.on("before_agent_start", async (event: { prompt?: string }, ctx: Parameters<typeof buildPromptSubmitPayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildPromptSubmitPayload(ctx, event.prompt);
    sendNotification(payload);

    // Start animated terminal title spinner (respects setting)
    if (loadSettings().dynamicTitles) {
      startSpinner(ctx);
    }
  });

  // -----------------------------------------------------------------------
  // Hook 2: Notify Warp when the agent completes its work
  // -----------------------------------------------------------------------
  pi.on("agent_end", async (event: { messages: Parameters<typeof buildStopPayload>[1] }, ctx: Parameters<typeof buildStopPayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildStopPayload(ctx, event.messages);
    sendNotification(payload);

    // Stop spinner and set static "ready" title
    stopSpinner(ctx);
  });

  // -----------------------------------------------------------------------
  // Hook 3: Session start — emit structured payload with plugin version,
  // then after a short delay emit a "stop" event so Warp shows a ready
  // (idle) state instead of staying in-progress.
  // -----------------------------------------------------------------------
  pi.on("session_start", async (_event: unknown, ctx: Parameters<typeof buildSessionStartPayload>[0] & { ui: { notify(message: string, level: string): void } }) => {
    if (!shouldUseStructured()) {
      console.log(
        "[pi-warp] Warp not detected or structured notifications not supported."
      );
      return;
    }

    const payload = buildSessionStartPayload(ctx, PLUGIN_VERSION);
    sendNotification(payload);
    ctx.ui.notify("Warp notifications active ✓", "info");

    // After a brief delay, tell Warp the agent is idle so it shows "ready"
    setTimeout(() => {
      const stopPayload = buildStopPayload(ctx, []);
      sendNotification(stopPayload);
      stopSpinner(ctx);
    }, 500);
  });

  // -----------------------------------------------------------------------
  // Hook 4: Tool execution end — emit tool_complete notification
  // -----------------------------------------------------------------------
  pi.on("tool_execution_end", async (event: { toolName: string }, ctx: Parameters<typeof buildToolCompletePayload>[0]) => {
    if (!shouldUseStructured()) return;

    const payload = buildToolCompletePayload(ctx, event.toolName);
    sendNotification(payload);
  });

  // -----------------------------------------------------------------------
  // Hook 5: DISABLED — permission_request is not wired to tool_call.
  // See README for details on deferred permission_request support.
  // -----------------------------------------------------------------------
}
