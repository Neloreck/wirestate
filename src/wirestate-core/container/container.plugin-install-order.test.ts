import { BindingType, Container, EventBus, EventsPlugin, inject, Injectable } from "@wirestate/core";

import { Optional } from "../types/general";

describe("container plugin install order", () => {
  it("installs plugins after user bindings, so a bind-if-absent plugin defers to the user's binding", () => {
    let sawUserBus: Optional<boolean>;

    // EventsPlugin.install binds EventBus only when the container does not already own it.
    // This records what that guard saw, then runs the real install.
    class ObservingEventsPlugin extends EventsPlugin {
      public override install(container: Container): void {
        sawUserBus = container.hasOwn(EventBus);
        super.install(container);
      }
    }

    @Injectable()
    class CustomEventBus extends EventBus {}

    const container: Container = new Container({
      bindings: [{ type: BindingType.Instance, token: EventBus, value: CustomEventBus }],
      plugins: [new ObservingEventsPlugin()],
    });

    // User bindings register first, so the guard sees the user's bus and defers.
    expect(sawUserBus).toBe(true);
    expect(container.get(EventBus)).toBeInstanceOf(CustomEventBus);
  });

  it("installs plugins before activation, so a service activated at construction can inject a plugin-bound dependency", () => {
    @Injectable()
    class EagerListener {
      public readonly bus: EventBus = inject(EventBus);
    }

    const container: Container = new Container({
      bindings: [EagerListener],
      activate: [EagerListener],
      plugins: [new EventsPlugin()],
    });

    // EventBus is bound by the plugin at install; activation resolving it proves install ran first.
    expect(container.get(EagerListener).bus).toBeInstanceOf(EventBus);
  });
});
