/**
 * Type declarations for the pi-coding-agent extension API.
 * This is a peer dependency available at runtime but not installed locally.
 */
declare module "@earendil-works/pi-coding-agent" {
  export interface ExtensionAPI {
    on(
      event: string,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: (event: any, ctx: ExtensionContext) => void | Promise<void>
    ): void;
  }

  export interface ExtensionContext {
    cwd: string;
    sessionManager: {
      getSessionFile(): string | undefined;
      getSessionName(): string | undefined;
    };
    ui: {
      notify(message: string, level: string): void;
    };
  }
}
