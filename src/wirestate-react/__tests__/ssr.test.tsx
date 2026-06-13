import { Container, inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { renderToString } from "react-dom/server";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { ContainerProvider, useInjection } from "../index";

describe("React SSR", () => {
  interface RootData {
    readonly locale: string;
  }

  interface ServiceData {
    readonly enabled: boolean;
    readonly userId: string;
  }

  it("should render managed root providers with bound construction data on the first pass", () => {
    const ROOT_TOKEN: unique symbol = Symbol("ROOT_TOKEN");
    const SERVICE_TOKEN: unique symbol = Symbol("SERVICE_TOKEN");
    const COUNT_TOKEN: unique symbol = Symbol("COUNT_TOKEN");

    @Injectable()
    class SeededService {
      public value: string = "pending";

      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnActivated()
      public initialize(): void {
        const root: RootData = this.scope.get<RootData>(ROOT_TOKEN);
        const service = this.scope.getOptional<ServiceData>(SERVICE_TOKEN);
        const count: number = this.scope.get<number>(COUNT_TOKEN);

        this.value = `${root.locale}:${service?.userId}:${String(service?.enabled)}:${String(count)}`;
      }
    }

    function Consumer() {
      const service: SeededService = useInjection(SeededService);

      return <span>{service.value}</span>;
    }

    const html: string = renderToString(
      <ContainerProvider
        config={{
          bindings: [
            SeededService,
            { token: ROOT_TOKEN, value: { locale: "en-US" } },
            { token: SERVICE_TOKEN, value: { enabled: false, userId: "user-1" } },
            { token: COUNT_TOKEN, value: 0 },
          ],
        }}
      >
        <Consumer />
      </ContainerProvider>
    );

    expect(html).toContain(">en-US:user-1:false:0</span>");
  });

  it("should lazily initialize injected services during the first server render when activation is disabled", () => {
    const events: Array<string> = [];
    const SERVICE_TOKEN: unique symbol = Symbol("SERVICE_TOKEN");

    @Injectable()
    class LazySeededService {
      public value: string = "pending";

      public constructor(private readonly scope: WireScope = inject(WireScope)) {}

      @OnActivated()
      public onActivated(): void {
        events.push("activated");

        this.value = this.scope.getOptional<ServiceData>(SERVICE_TOKEN)?.userId ?? "missing";
      }
    }

    function Consumer() {
      const service: LazySeededService = useInjection(LazySeededService);

      return <span>{service.value}</span>;
    }

    const html: string = renderToString(
      <ContainerProvider
        config={{
          activate: false,
          bindings: [LazySeededService, { token: SERVICE_TOKEN, value: { enabled: true, userId: "lazy-user" } }],
        }}
      >
        <Consumer />
      </ContainerProvider>
    );

    expect(html).toContain("lazy-user");
    expect(events).toEqual(["activated"]);
  });

  it("should not run provider provision effects during server rendering", () => {
    const { events, LifecycleService } = createLifecycleService();

    renderToString(
      <ContainerProvider
        config={{
          bindings: [LifecycleService],
        }}
      />
    );

    expect(events).toEqual(["activated"]);
  });

  it("should render external containers on the first pass", () => {
    const STRING_VALUE_TOKEN: unique symbol = Symbol("STRING_VALUE_TOKEN");
    const container: Container = new Container();

    container.bind({ token: STRING_VALUE_TOKEN, value: "external-parent" });

    function Consumer() {
      const value: string = useInjection(STRING_VALUE_TOKEN);

      return <span>{value}</span>;
    }

    const html: string = renderToString(
      <ContainerProvider container={container}>
        <Consumer />
      </ContainerProvider>
    );

    expect(html).toContain("external-parent");
  });
});
