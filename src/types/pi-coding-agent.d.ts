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
    registerCommand(
      name: string,
      options: {
        description?: string;
        handler: (args: string, ctx: ExtensionCommandContext) => void | Promise<void>;
      }
    ): void;
  }

  export function getSettingsListTheme(): Record<string, unknown>;

  export interface ExtensionContext {
    cwd: string;
    sessionManager: {
      getSessionFile(): string | undefined;
      getSessionName(): string | undefined;
    };
    ui: {
      notify(message: string, level: string): void;
      custom<T>(
        factory: (
          tui: unknown,
          theme: UiTheme,
          keybindings: unknown,
          done: (value: T) => void,
        ) => CustomComponent,
      ): Promise<T>;
    };
  }

  // ExtensionCommandContext has the same members as ExtensionContext
  // plus session control methods not needed for type checking here.
  export type ExtensionCommandContext = ExtensionContext;

  export interface UiTheme {
    fg(color: string, text: string): string;
    bold(text: string): string;
  }

  export interface CustomComponent {
    render(width: number): string[];
    invalidate(): void;
    handleInput?(data: string): void;
  }
}

declare module "@earendil-works/pi-tui" {
  export interface SettingItem {
    id: string;
    label: string;
    currentValue: string;
    values: string[];
  }

  export class SettingsList {
    constructor(
      items: SettingItem[],
      maxVisible: number,
      theme: Record<string, unknown>,
      onChange: (id: string, newValue: string) => void,
      onClose: () => void,
      options?: { enableSearch?: boolean },
    );
    handleInput?(data: string): void;
  }

  export class Container {
    addChild(child: unknown): void;
    render(width: number): string[];
    invalidate(): void;
  }
}
