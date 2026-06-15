import {
  CommandBus,
  CommandsPlugin,
  Container,
  inject,
  Injectable,
  OnActivated,
  OnCommand,
  OnDeactivation,
  OnDeprovision,
} from "@wirestate/core";

import { Nullable } from "../../types/general";

describe("core command messaging integration", () => {
  it("keeps parent and child command buses separate", () => {
    const ADD_COMMAND: string = "ADD_COMMAND";
    const PARENT_TOKEN: string = "PARENT_TOKEN";
    const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

    interface SettingsData {
      readonly offset: number;
    }

    @Injectable()
    class ParentCounterService {
      private count: number = 0;

      public constructor(private readonly container: Container = inject(Container)) {}

      @OnCommand(ADD_COMMAND)
      public add(value: number): number {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        this.count += value + settings.offset;

        return this.count;
      }
    }

    @Injectable()
    class ChildCounterService {
      private count: number = 100;

      public constructor(private readonly container: Container = inject(Container)) {}

      @OnCommand(ADD_COMMAND)
      public add(value: number): number {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        this.count += value + settings.offset;

        return this.count;
      }
    }

    const parent: Container = new Container({
      activate: [ParentCounterService],
      bindings: [
        ParentCounterService,
        { token: PARENT_TOKEN, value: "root-value" },
        { token: SETTINGS_TOKEN, value: { offset: 1 } },
      ],
      plugins: [new CommandsPlugin()],
    }).provision();

    const child: Container = new Container({
      activate: [ChildCounterService],
      bindings: [ChildCounterService, { token: SETTINGS_TOKEN, value: { offset: 10 } }],
      parent: parent,
      plugins: [new CommandsPlugin()],
    }).provision();

    expect(child.get(PARENT_TOKEN)).toBe("root-value");
    expect(child.get(CommandBus)).not.toBe(parent.get(CommandBus));

    expect(parent.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(3);
    expect(child.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(112);

    child.unbindAll();

    expect(parent.get(CommandBus).execute(ADD_COMMAND, 2)).toBe(6);
  });

  it("restores the shadowed command handler after the shadowing instance is removed", () => {
    const FORMAT_COMMAND: string = "FORMAT_COMMAND";
    const lifecycle: Array<string> = [];

    @Injectable()
    class PrimaryHandlerService {
      private value: string = "primary";

      @OnActivated()
      public onActivated(): void {
        lifecycle.push("primary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("primary:deactivated");
      }

      @OnCommand(FORMAT_COMMAND)
      public format(input: string): string {
        this.value = `primary:${input}`;

        return this.value;
      }
    }

    @Injectable()
    class SecondaryHandlerService {
      private value: string = "secondary";

      @OnActivated()
      public onActivated(): void {
        lifecycle.push("secondary:activated");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        lifecycle.push("secondary:deactivated");
      }

      @OnCommand(FORMAT_COMMAND)
      public format(input: string): string {
        this.value = `secondary:${input}`;

        return this.value;
      }
    }

    const container: Container = new Container({
      activate: [PrimaryHandlerService, SecondaryHandlerService],
      bindings: [PrimaryHandlerService, SecondaryHandlerService],
      plugins: [new CommandsPlugin()],
    }).provision();

    expect(container.get(CommandBus).hasHandler(FORMAT_COMMAND)).toBe(true);
    expect(lifecycle).toEqual(["primary:activated", "secondary:activated"]);
    expect(container.get(CommandBus).execute(FORMAT_COMMAND, "first")).toBe("secondary:first");

    container.unbind(SecondaryHandlerService);

    expect(lifecycle).toEqual(["primary:activated", "secondary:activated", "secondary:deactivated"]);
    expect(container.get(CommandBus).execute(FORMAT_COMMAND, "second")).toBe("primary:second");

    container.unbind(PrimaryHandlerService);

    expect(container.get(CommandBus).hasHandler(FORMAT_COMMAND)).toBe(false);
    expect(() => container.get(CommandBus).execute(FORMAT_COMMAND, "third")).toThrow(
      "No command handler registered in container for type: 'FORMAT_COMMAND'."
    );
  });

  it("lets a service execute commands while it deprovisions", async () => {
    const DEACTIVATE_COMMAND: string = "DEACTIVATE_COMMAND";
    const SETTINGS_TOKEN: string = "SETTINGS_TOKEN";

    const logs: Array<string> = [];
    let commandResult: Nullable<Promise<string>> = null as Nullable<Promise<string>>;

    interface SettingsData {
      readonly label: string;
    }

    @Injectable()
    class CleanupService {
      public constructor(
        private readonly container: Container = inject(Container),
        private readonly commandBus: CommandBus = inject(CommandBus)
      ) {}

      @OnDeprovision()
      public onDeprovision(): void {
        const settings: SettingsData = this.container.get<SettingsData>(SETTINGS_TOKEN);

        logs.push(`settings:${settings.label}`);

        commandResult = this.commandBus.executeAsync<string>(DEACTIVATE_COMMAND);
      }

      @OnCommand(DEACTIVATE_COMMAND)
      public onCommand(): string {
        logs.push("command");

        return "command-result";
      }
    }

    const container: Container = new Container({
      activate: [CleanupService],
      bindings: [CleanupService, { token: SETTINGS_TOKEN, value: { label: "cleanup-label" } }],
      plugins: [new CommandsPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["settings:cleanup-label", "command"]);
    expect(commandResult).not.toBeNull();

    expect(await commandResult).toBe("command-result");
    expect(logs).toEqual(["settings:cleanup-label", "command"]);
    expect(container.has(CleanupService)).toBe(false);
    expect(container.has(CommandBus)).toBe(false);
  });

  it("lets services execute each other's commands while deprovisioning", async () => {
    const PEER_DEACTIVATE_COMMAND: string = "PEER_DEACTIVATE_COMMAND";

    const logs: Array<string> = [];
    let commandResult: Nullable<Promise<string>> = null as Nullable<Promise<string>>;

    @Injectable()
    class DeactivationPeerService {
      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("peer-deprovision");
      }

      @OnCommand(PEER_DEACTIVATE_COMMAND)
      public onCommand(value: string): string {
        logs.push(`peer-command:${value}`);

        return "peer-command-result";
      }
    }

    @Injectable()
    class DeactivationCoordinatorService {
      public constructor(private readonly commandBus: CommandBus = inject(CommandBus)) {}

      @OnDeprovision()
      public onDeprovision(): void {
        logs.push("coordinator-deprovision");

        commandResult = this.commandBus.executeAsync<string, string>(PEER_DEACTIVATE_COMMAND, "from-coordinator");
      }
    }

    new Container({
      activate: [DeactivationCoordinatorService, DeactivationPeerService],
      bindings: [DeactivationPeerService, DeactivationCoordinatorService],
      plugins: [new CommandsPlugin()],
    })
      .provision()
      .unbindAll();

    expect(logs).toEqual(["coordinator-deprovision", "peer-command:from-coordinator", "peer-deprovision"]);
    expect(commandResult).not.toBeNull();

    expect(await commandResult).toBe("peer-command-result");
  });

  it("dispatches a symbol-typed command handler through a provisioned container", () => {
    const ADD: unique symbol = Symbol("ADD");

    @Injectable()
    class SymbolCommandService {
      @OnCommand(ADD)
      public add(value: number): number {
        return value + 1;
      }
    }

    const container: Container = new Container({
      activate: [SymbolCommandService],
      bindings: [SymbolCommandService],
      plugins: [new CommandsPlugin()],
    }).provision();

    expect(container.get(CommandBus).execute(ADD, 41)).toBe(42);
  });

  it("skips a non-function member decorated as a command handler", () => {
    const HANDLE_COMMAND: string = "HANDLE_COMMAND";

    @Injectable()
    class PartiallyCorruptedService {
      @OnCommand(HANDLE_COMMAND)
      public handle(value: number): number {
        return value + 1;
      }

      // @ts-ignore - Sabotage with a non-function member.
      @OnCommand("CORRUPTED_COMMAND")
      public corrupted: string = "not-a-function";
    }

    const container: Container = new Container({
      activate: [PartiallyCorruptedService],
      bindings: [PartiallyCorruptedService],
      plugins: [new CommandsPlugin()],
    }).provision();

    // The valid handler is wired; the non-function member is skipped without error.
    expect(container.get(CommandBus).execute(HANDLE_COMMAND, 1)).toBe(2);
    expect(container.get(CommandBus).hasHandler("CORRUPTED_COMMAND")).toBe(false);
  });
});
