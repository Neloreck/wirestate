/**
 * @jest-environment jsdom
 */

import { act, render } from "@testing-library/react";
import {
  type ContainerConfig,
  CommandBus,
  CommandsPlugin,
  Container,
  EventBus,
  EventsPlugin,
  Injectable,
  OnCommand,
  OnEvent,
  OnQuery,
  QueriesPlugin,
  QueryBus,
} from "@wirestate/core";
import {
  DEVTOOLS_HOOK_KEY,
  type DevtoolsEvent,
  type DevtoolsHook,
  DevToolsPlugin,
  getDevtoolsHook,
} from "@wirestate/core/devtools";
import { ContainerProvider } from "@wirestate/react";
import { StrictMode } from "react";

/**
 * End-to-end validation of the v1 devtools protocol:
 * a backend that talks only to the hook (`getRoots()` + `subscribe()`) reconstructs
 * the model while a real `ContainerProvider` app drives the framework lifecycle.
 */
@Injectable()
class Feature {
  @OnEvent("PING")
  public onPing(): void {}

  @OnCommand("SAVE")
  public save(): string {
    return "saved";
  }

  @OnQuery("COUNT")
  public count(): number {
    return 7;
  }
}

function createConfig(): ContainerConfig {
  return {
    bindings: [Feature],
    plugins: [new EventsPlugin(), new CommandsPlugin(), new QueriesPlugin(), new DevToolsPlugin()],
  };
}

function hook(): DevtoolsHook {
  return getDevtoolsHook() as DevtoolsHook;
}

describe("devtools protocol — React-driven consumer e2e", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)[DEVTOOLS_HOOK_KEY];
  });

  it("reconstructs the container tree, instances, plugins, and declared handlers on mount", () => {
    const container: Container = new Container(createConfig());

    render(
      <StrictMode>
        <ContainerProvider container={container} />
      </StrictMode>
    );

    const snapshot = hook().getRoots()[0].snapshot();
    const root = snapshot.containers[0];

    const instances: Array<string> = root.instances.map((instance) => instance.className);

    expect(instances).toContain("Feature");

    const plugins: Array<string> = root.plugins.map((plugin) => plugin.name);

    expect(plugins).toEqual(
      expect.arrayContaining(["EventsPlugin", "CommandsPlugin", "QueriesPlugin", "DevToolsPlugin"])
    );

    const handlers: Array<string> = root.instances
      .flatMap((instance) => instance.handlers)
      .map((handler) => `${handler.channel}:${handler.type}`);

    expect(handlers).toEqual(expect.arrayContaining(["event:PING", "command:SAVE", "query:COUNT"]));
  });

  it("streams messages and registrations to a subscribed consumer", () => {
    const container: Container = new Container(createConfig());

    render(<ContainerProvider container={container} />);

    const events: Array<DevtoolsEvent> = [];

    hook().subscribe((event) => events.push(event));

    act(() => {
      container.get(EventBus).emit("PING", { n: 1 });
      container.get(CommandBus).execute("SAVE");
      container.get(QueryBus).query("COUNT");
      container.get(CommandBus).register("MANUAL", () => undefined)();
    });

    const messages: Array<string> = events.flatMap((event) =>
      event.kind === "message" ? [`${event.message.channel}:${event.message.type}`] : []
    );

    expect(messages).toEqual(expect.arrayContaining(["event:PING", "command:SAVE", "query:COUNT"]));

    const registrations: Array<string> = events.flatMap((event) =>
      event.kind === "registration" ? [`${event.registration.phase}:${event.registration.type}`] : []
    );

    expect(registrations).toEqual(expect.arrayContaining(["registered:MANUAL", "unregistered:MANUAL"]));
  });

  it("reports teardown and prunes the container the app has dropped", () => {
    const container: Container = new Container(createConfig());

    const view = render(<ContainerProvider container={container} />);

    const events: Array<DevtoolsEvent> = [];

    hook().subscribe((event) => events.push(event));

    // Unmount deprovisions the external container; unbindAll then deactivates it.
    act(() => view.unmount());
    container.unbindAll();

    const phases: Array<string> = events.flatMap((event) => (event.kind === "lifecycle" ? [event.phase] : []));

    expect(phases).toContain("containerDeprovision");
    expect(phases).toContain("deactivate");

    // The app dropped its only container, so the plugin releases the root entirely — no empty shell
    // lingers (and with it, no trace of the torn-down Feature).
    expect(hook().getRoots()).toHaveLength(0);
  });

  it("surfaces independent providers as separate roots", () => {
    render(<ContainerProvider container={new Container(createConfig())} />);
    render(<ContainerProvider container={new Container(createConfig())} />);

    expect(hook().getRoots()).toHaveLength(2);
  });

  it("registers one root under StrictMode with a managed provider (no throwaway duplication)", () => {
    // A managed provider under StrictMode: React double-invokes the useState initializer,
    // so the same config (and its DevToolsPlugin instance) constructs a throwaway container
    // alongside the committed one. Only the committed container provisions, so the inspector
    // must see exactly one root and one live container — not the pre-fix duplicate roots /
    // phantom throwaway.
    const config: ContainerConfig = createConfig();

    render(
      <StrictMode>
        <ContainerProvider config={config} />
      </StrictMode>
    );

    const roots = hook().getRoots();

    expect(roots).toHaveLength(1);

    const snapshot = roots[0].snapshot();

    expect(snapshot.containers).toHaveLength(1);
    expect(snapshot.containers[0].instances.map((instance) => instance.className)).toContain("Feature");
  });
});
