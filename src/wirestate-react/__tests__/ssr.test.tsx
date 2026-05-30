import { Container, Inject, Injectable, OnActivated, WireScope } from "@wirestate/core";
import { renderToString } from "react-dom/server";

import { createLifecycleService } from "@/fixtures/services/lifecycle-service";

import { ContainerProvider, SubContainerProvider, useInjection } from "../index";

describe("React SSR", () => {
  interface RootSeed {
    readonly locale: string;
  }

  interface ServiceSeed {
    readonly enabled: boolean;
    readonly userId: string;
  }

  interface ChildSeed {
    readonly tenantId: string;
  }

  it("should render managed root providers with shared and targeted seeds on the first pass", () => {
    const COUNT_SEED_TOKEN: unique symbol = Symbol("COUNT_SEED_TOKEN");

    @Injectable()
    class SeededService {
      public value: string = "pending";

      public constructor(
        @Inject(WireScope)
        private readonly scope: WireScope
      ) {}

      @OnActivated()
      public initialize(): void {
        const sharedSeed: RootSeed = this.scope.getSeed<RootSeed>();
        const serviceSeed = this.scope.getSeed<ServiceSeed>(SeededService);
        const countSeed = this.scope.getSeed<number>(COUNT_SEED_TOKEN);

        this.value = `${sharedSeed.locale}:${serviceSeed?.userId}:${String(serviceSeed?.enabled)}:${String(countSeed)}`;
      }
    }

    function Consumer() {
      const service: SeededService = useInjection(SeededService);

      return <span>{service.value}</span>;
    }

    const html: string = renderToString(
      <ContainerProvider
        config={{
          bindings: [SeededService],
          seed: { locale: "en-US" },
          seeds: [
            [SeededService, { enabled: false, userId: "user-1" }],
            [COUNT_SEED_TOKEN, 0],
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

    @Injectable()
    class LazySeededService {
      public value: string = "pending";

      public constructor(
        @Inject(WireScope)
        private readonly scope: WireScope
      ) {}

      @OnActivated()
      public onActivated(): void {
        events.push("activated");

        this.value = this.scope.getSeed<ServiceSeed>(LazySeededService)?.userId ?? "missing";
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
          bindings: [LazySeededService],
          seeds: [[LazySeededService, { enabled: true, userId: "lazy-user" }]],
        }}
      >
        <Consumer />
      </ContainerProvider>
    );

    expect(html).toContain("lazy-user");
    expect(events).toEqual(["activated"]);
  });

  it("should render child containers with targeted seeds and parent bindings on the first pass", () => {
    const STRING_VALUE_TOKEN: unique symbol = Symbol("STRING_VALUE_TOKEN");

    @Injectable()
    class ChildSeededService {
      public value: string = "pending";

      public constructor(
        @Inject(WireScope)
        private readonly scope: WireScope
      ) {}

      @OnActivated()
      public onActivated(): void {
        const childSeed = this.scope.getSeed<ChildSeed>(ChildSeededService);
        const parentValue: string = this.scope.resolve(STRING_VALUE_TOKEN);

        this.value = `${childSeed?.tenantId}:${parentValue}`;
      }
    }

    function Consumer() {
      const service: ChildSeededService = useInjection(ChildSeededService);

      return <span>{service.value}</span>;
    }

    const html: string = renderToString(
      <ContainerProvider config={{ bindings: [{ id: STRING_VALUE_TOKEN, value: "string-value" }] }}>
        <SubContainerProvider bindings={[ChildSeededService]} seeds={[[ChildSeededService, { tenantId: "tenant-a" }]]}>
          <Consumer />
        </SubContainerProvider>
      </ContainerProvider>
    );

    expect(html).toContain("tenant-a:string-value");
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

    container.bind(STRING_VALUE_TOKEN).toConstantValue("external-parent");

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
