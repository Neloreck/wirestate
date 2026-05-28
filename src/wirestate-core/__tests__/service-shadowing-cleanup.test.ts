import {
  CommandBus,
  Container,
  EventBus,
  Injectable,
  OnActivated,
  OnCommand,
  OnDeactivation,
  OnEvent,
  OnQuery,
  QueryBus,
  createContainer,
} from "../index";

describe("core service shadowing and cleanup integration", () => {
  const FORMAT_COMMAND: string = "FORMAT_COMMAND";
  const CURRENT_QUERY: string = "CURRENT_QUERY";
  const TOUCH_EVENT: string = "TOUCH_EVENT";

  const lifecycle: Array<string> = [];
  const events: Array<string> = [];

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

    @OnQuery(CURRENT_QUERY)
    public getCurrent(): string {
      return this.value;
    }

    @OnEvent(TOUCH_EVENT)
    public onTouch(event: { readonly payload?: string }): void {
      events.push(`primary:${event.payload ?? "empty"}`);
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

    @OnQuery(CURRENT_QUERY)
    public getCurrent(): string {
      return this.value;
    }

    @OnEvent(TOUCH_EVENT)
    public onTouch(event: { readonly payload?: string }): void {
      events.push(`secondary:${event.payload ?? "empty"}`);
    }
  }

  beforeEach(() => {
    lifecycle.length = 0;
    events.length = 0;
  });

  it("restores previous command and query handlers after the shadowing service is removed", async () => {
    const container: Container = createContainer({
      activate: [PrimaryHandlerService, SecondaryHandlerService],
      bindings: [PrimaryHandlerService, SecondaryHandlerService],
    });

    expect(container.get(CommandBus).has(FORMAT_COMMAND)).toBe(true);
    expect(container.get(QueryBus).has(CURRENT_QUERY)).toBe(true);
    expect(lifecycle).toEqual(["primary:activated", "secondary:activated"]);

    expect(await container.get(CommandBus).command(FORMAT_COMMAND, "first").task).toBe("secondary:first");
    expect(container.get(QueryBus).query(CURRENT_QUERY)).toBe("secondary:first");

    container.unbind(SecondaryHandlerService);

    expect(lifecycle).toEqual(["primary:activated", "secondary:activated", "secondary:deactivated"]);
    expect(await container.get(CommandBus).command(FORMAT_COMMAND, "second").task).toBe("primary:second");
    expect(container.get(QueryBus).query(CURRENT_QUERY)).toBe("primary:second");

    container.unbind(PrimaryHandlerService);

    expect(container.get(CommandBus).has(FORMAT_COMMAND)).toBe(false);
    expect(container.get(QueryBus).has(CURRENT_QUERY)).toBe(false);

    expect(() => container.get(CommandBus).command(FORMAT_COMMAND, "third")).toThrow(
      "No command handler registered in container for type: 'FORMAT_COMMAND'."
    );
    expect(() => container.get(QueryBus).query(CURRENT_QUERY)).toThrow(
      "No query handler registered in container for type: 'CURRENT_QUERY'."
    );
  });

  it("broadcasts events to all active services and removes only disconnected listeners", () => {
    const container: Container = createContainer({
      activate: [PrimaryHandlerService, SecondaryHandlerService],
      bindings: [PrimaryHandlerService, SecondaryHandlerService],
    });

    const bus: EventBus = container.get(EventBus);

    bus.emit(TOUCH_EVENT, "one");
    expect(events).toEqual(["primary:one", "secondary:one"]);
    expect(bus.has()).toBe(true);

    container.unbind(SecondaryHandlerService);
    bus.emit(TOUCH_EVENT, "two");

    expect(events).toEqual(["primary:one", "secondary:one", "primary:two"]);

    container.unbind(PrimaryHandlerService);
    bus.emit(TOUCH_EVENT, "three");

    expect(events).toEqual(["primary:one", "secondary:one", "primary:two"]);
    expect(bus.has()).toBe(false);
  });
});
