/**
 * @jest-environment jsdom
 */

import { render } from "@testing-library/react";
import {
  type ContainerConfig,
  CommandBus,
  CommandsPlugin,
  Container,
  EventBus,
  EventsPlugin,
  Injectable,
  OnCommand,
  OnDeprovision,
  OnEvent,
  OnProvision,
  OnQuery,
  QueriesPlugin,
  QueryBus,
  inject,
} from "@wirestate/core";
import { type ReactElement, type ReactNode, useEffect, useLayoutEffect, useMemo } from "react";

import { useInjection } from "../injection/use-injection";

import { ContainerProvider } from "./container-provider";

/**
 * React commits effects child-first, so where the provider provisions decides whether a child's
 * mount effect can reach a messaging handler. These pin the guarantee and the two ordering limits
 * that survive it, so a future move back to a passive effect fails loudly instead of silently
 * killing handlers during mount.
 */
describe("ContainerProvider provision ordering", () => {
  it("provisions before a descendant's mount effect", () => {
    const order: Array<string> = [];

    @Injectable()
    class Service {
      @OnProvision()
      public onProvision(): void {
        order.push("provision");
      }
    }

    function Child(): null {
      useEffect(() => {
        order.push("child:useEffect");
      }, []);

      return null;
    }

    render(
      <ContainerProvider config={{ bindings: [Service] }}>
        <Child />
      </ContainerProvider>
    );

    expect(order).toEqual(["provision", "child:useEffect"]);
  });

  it("lets a child query a service handler from its mount effect", () => {
    let caught: unknown = null;

    @Injectable()
    class CheckoutService {
      @OnQuery("CHECKOUT_SUMMARY")
      public onSummary(): number {
        return 3;
      }
    }

    function Badge(): ReactElement {
      const queryBus: QueryBus = useInjection(QueryBus);

      useEffect(() => {
        try {
          queryBus.query<number>("CHECKOUT_SUMMARY");
        } catch (error) {
          caught = error;
        }
      }, [queryBus]);

      return <span />;
    }

    render(
      <ContainerProvider config={{ bindings: [CheckoutService], plugins: [new QueriesPlugin()] }}>
        <Badge />
      </ContainerProvider>
    );

    expect(caught).toBeNull();
  });

  it("lets a child execute a command handler from its mount effect", () => {
    let result: unknown = null;

    @Injectable()
    class SaveService {
      @OnCommand("SAVE")
      public onSave(): string {
        return "saved";
      }
    }

    function Saver(): null {
      const commandBus: CommandBus = useInjection(CommandBus);

      useEffect(() => {
        result = commandBus.execute<string>("SAVE");
      }, [commandBus]);

      return null;
    }

    render(
      <ContainerProvider config={{ bindings: [SaveService], plugins: [new CommandsPlugin()] }}>
        <Saver />
      </ContainerProvider>
    );

    expect(result).toBe("saved");
  });

  it("delivers an event emitted from a child's mount effect to a service handler", () => {
    const received: Array<string> = [];

    @Injectable()
    class ListenerService {
      @OnEvent("PING")
      public onPing(): void {
        received.push("ping");
      }
    }

    function Emitter(): null {
      const eventBus: EventBus = useInjection(EventBus);

      useEffect(() => {
        eventBus.emit("PING");
      }, [eventBus]);

      return null;
    }

    render(
      <ContainerProvider config={{ bindings: [ListenerService], plugins: [new EventsPlugin()] }}>
        <Emitter />
      </ContainerProvider>
    );

    // Events are fire-and-forget, so an unprovisioned bus would silently drop this instead of
    // throwing. Asserting delivery is the only way this regression would surface.
    expect(received).toEqual(["ping"]);
  });

  describe("known ordering limits", () => {
    it("deprovisions before a descendant's effect cleanup", () => {
      const order: Array<string> = [];

      @Injectable()
      class Service {
        @OnDeprovision()
        public onDeprovision(): void {
          order.push("deprovision");
        }
      }

      function Child(): null {
        useEffect(() => {
          return () => {
            order.push("child:cleanup");
          };
        }, []);

        return null;
      }

      const { unmount } = render(
        <ContainerProvider config={{ bindings: [Service] }}>
          <Child />
        </ContainerProvider>
      );

      unmount();

      // The cost of provisioning in a layout effect: its cleanup is a layout cleanup, and React
      // runs those before passive ones, so teardown is not the mirror of setup. Splitting the two
      // halves across phases fixes this but desynchronizes them when the container changes, which
      // leaves two containers provisioned at once - a worse failure. Documented on
      // ContainerProvider: send from @OnDeprovision, not from a child's cleanup.
      expect(order).toEqual(["deprovision", "child:cleanup"]);
    });

    it("still provisions after a descendant's layout effect", () => {
      const order: Array<string> = [];

      @Injectable()
      class Service {
        @OnProvision()
        public onProvision(): void {
          order.push("provision");
        }
      }

      function Child(): null {
        useLayoutEffect(() => {
          order.push("child:useLayoutEffect");
        }, []);

        return null;
      }

      render(
        <ContainerProvider config={{ bindings: [Service] }}>
          <Child />
        </ContainerProvider>
      );

      // React runs a child's layout effect before its parent's, and no effect phase changes that.
      // Documented on ContainerProvider: send from useEffect, not useLayoutEffect.
      expect(order).toEqual(["child:useLayoutEffect", "provision"]);
    });

    it("provisions a nested container before its parent container", () => {
      const order: Array<string> = [];

      @Injectable()
      class ParentService {
        @OnProvision()
        public onProvision(): void {
          order.push("parent:provision");
        }
      }

      @Injectable()
      class ChildService {
        @OnProvision()
        public onProvision(): void {
          order.push("child:provision");
        }
      }

      function Inner({ parent }: { parent: Container }): ReactElement {
        const config: ContainerConfig = useMemo(() => ({ parent, bindings: [ChildService] }), [parent]);

        return <ContainerProvider config={config} />;
      }

      function Outer(): ReactElement {
        const parent: Container = useMemo(() => new Container({ bindings: [ParentService], activate: true }), []);

        return (
          <ContainerProvider container={parent}>
            <Inner parent={parent} />
          </ContainerProvider>
        );
      }

      render(<Outer />);

      // Nested providers are still committed child-first, so a child container's @OnProvision
      // cannot reach a parent container's handler. Only provisioning during render would fix it.
      expect(order).toEqual(["child:provision", "parent:provision"]);
    });
  });

  it("keeps handlers live for a child that resolves the bus itself", () => {
    const seen: Array<string> = [];

    @Injectable()
    class Publisher {
      public constructor(private readonly eventBus: EventBus = inject(EventBus)) {}

      @OnProvision()
      public onProvision(): void {
        this.eventBus.emit("READY");
      }
    }

    @Injectable()
    class Listener {
      @OnEvent("READY")
      public onReady(): void {
        seen.push("ready");
      }
    }

    function Child(): null {
      return null;
    }

    render(
      <ContainerProvider config={{ bindings: [Listener, Publisher], plugins: [new EventsPlugin()] }}>
        <Child />
      </ContainerProvider>
    );

    // Handlers subscribe before any @OnProvision runs, so a service can message its peers there.
    expect(seen).toEqual(["ready"]);
  });
});

/**
 * Guards the mechanism the fix depends on. If React ever changed commit ordering so a parent's
 * layout effect no longer preceded a child's passive effect, every test above would still pass
 * for the wrong reason until this one failed.
 */
describe("React commit ordering assumption", () => {
  it("runs a parent layout effect before a child passive effect", () => {
    const order: Array<string> = [];

    function Parent({ children }: { children: ReactNode }): ReactNode {
      useLayoutEffect(() => {
        order.push("parent:layout");
      }, []);

      return children;
    }

    function Child(): null {
      useEffect(() => {
        order.push("child:passive");
      }, []);

      useLayoutEffect(() => {
        order.push("child:layout");
      }, []);

      return null;
    }

    render(
      <Parent>
        <Child />
      </Parent>
    );

    expect(order).toEqual(["child:layout", "parent:layout", "child:passive"]);
  });
});
