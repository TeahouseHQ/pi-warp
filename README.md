# warp-notify

A [pi](https://github.com/earendil-works/pi-coding-agent) extension that sends real-time agent notifications to the [Warp](https://www.warp.dev/) terminal via OSC 777 escape sequences.

## How it works

The extension hooks into pi's lifecycle events and emits structured JSON payloads to `/dev/tty` using Warp's OSC 777 notification protocol. Warp picks up these sequences and surfaces agent activity inline in the terminal.

### Supported events

| Event | Trigger | Payload type |
|---|---|---|
| **Session start** | pi session begins | `session_start` |
| **Prompt submit** | User submits a prompt | `prompt_submit` |
| **Permission request** | *(unused — deferred)* | `permission_request` |
| **Tool complete** | Tool execution finishes | `tool_complete` |
| **Agent end** | Agent finishes its work | `stop` |

## Requirements

- **Warp terminal** with CLI agent notification support (builds newer than `v0.2026.03.25.08.04.stable_05` / `v0.2026.03.25.08.04.preview_05`)
- **pi** coding agent
- **Node.js** ≥ 20

Warp signals support through two environment variables:
- `WARP_CLI_AGENT_PROTOCOL_VERSION` — protocol version to negotiate
- `WARP_CLIENT_VERSION` — used to detect known-broken builds

If either variable is missing, the extension silently disables itself.

## Installation

Clone or copy this directory into your pi extensions folder and install dependencies:

```bash
npm install
```

## Development

```bash
npm test        # run tests with vitest
```

## Protocol

Notifications are written as OSC 777 sequences to `/dev/tty`:

```
\x1b]777;notify;warp://cli-agent;<json-payload>\x07
```

Each payload includes a common base:

```jsonc
{
  "v": 1,              // negotiated protocol version
  "agent": "pi",
  "event": "stop",     // event type
  "session_id": "...",
  "cwd": "/path/to/project",
  "project": "my-project"
}
```

Individual events add their own fields (e.g. `query`, `response`, `tool_name`, `plugin_version`).

> **Note:** `permission_request` payloads and the `tool_call` hook are implemented in `src/events.ts` but **not wired to any pi lifecycle event**. They are deferred until Warp defines a UX for permission notifications. The builder function (`buildPermissionRequestPayload`) is exported and tested but currently unused.

## License

Private
