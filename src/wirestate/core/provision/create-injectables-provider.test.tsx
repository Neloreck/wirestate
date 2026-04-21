import { render, cleanup } from "@testing-library/react";
import { Container, injectable } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { createInjectablesProvider } from "@/wirestate/core/provision/create-injectables-provider";
import { SEED_TOKEN, SEEDS_TOKEN } from "@/wirestate/core/registry";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { OnActivated } from "@/wirestate/core/service/on-activated";
import { OnDeactivation } from "@/wirestate/core/service/on-deactivation";
import { useInjection } from "@/wirestate/core/service/use-injection";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { TSeedEntries } from "@/wirestate/types/initial-state";

describe("createInjectablesProvider", () => {
  let firstServiceActivated: number = 0;
  let firstServiceDeactivated: number = 0;
  let secondServiceActivated: number = 0;
  let secondServiceDeactivated: number = 0;

  @injectable()
  class FirstService extends AbstractService {
    public value: string = "A";

    @OnActivated()
    public activate(): void {
      firstServiceActivated += 1;
    }

    @OnDeactivation()
    public deactivate(): void {
      firstServiceDeactivated += 1;
    }
  }

  @injectable()
  class SecondService extends AbstractService {
    public value: string = "B";

    @OnActivated()
    public activate(): void {
      secondServiceActivated += 1;
    }

    @OnDeactivation()
    public deactivate(): void {
      secondServiceDeactivated += 1;
    }
  }

  afterEach(() => {
    cleanup();

    firstServiceActivated = 0;
    firstServiceDeactivated = 0;
    secondServiceActivated = 0;
    secondServiceDeactivated = 0;
  });

  it("should bind and provide services to children", () => {
    const container: Container = mockContainer();
    const Provider = createInjectablesProvider([FirstService]);

    function TestChild() {
      const service: FirstService = useInjection(FirstService);

      return <div data-testid="injectable-name">{service.constructor.name}</div>;
    }

    const { getByTestId } = render(
      withIocProvider(
        <Provider>
          <TestChild />
        </Provider>,
        container
      )
    );

    expect(getByTestId("injectable-name").textContent).toBe(FirstService.name);
    expect(firstServiceActivated).toBe(1);
    expect(firstServiceDeactivated).toBe(0);
    expect(secondServiceActivated).toBe(0);
    expect(secondServiceDeactivated).toBe(0);
  });

  it("should validate activate entries against provided entries", () => {
    expect(() => createInjectablesProvider([FirstService], { activate: [SecondService] })).toThrow(
      /is listed in 'activate' but was not provided in 'entries'/
    );
  });

  it("should unbind services on unmount", () => {
    const container = mockContainer();
    const Provider = createInjectablesProvider([FirstService, SecondService]);

    const { unmount } = render(
      withIocProvider(
        <Provider>
          <div />
        </Provider>,
        container
      )
    );

    expect(container.isBound(FirstService)).toBe(true);
    expect(container.isBound(SecondService)).toBe(true);

    unmount();

    expect(container.isBound(FirstService)).toBe(false);
    expect(container.isBound(SecondService)).toBe(false);
    expect(firstServiceActivated).toBe(0);
    expect(secondServiceActivated).toBe(0);
  });

  it("should eager activate and then unbind services on unmount", () => {
    const container = mockContainer();
    const Provider = createInjectablesProvider([FirstService, SecondService], {
      activate: [SecondService],
    });

    function TestChild() {
      const service: FirstService = useInjection(FirstService);

      return <div data-testid={"injectable-name"}>{service.constructor.name}</div>;
    }

    expect(firstServiceActivated).toBe(0);
    expect(firstServiceDeactivated).toBe(0);
    expect(secondServiceActivated).toBe(0);
    expect(firstServiceDeactivated).toBe(0);

    const { unmount } = render(
      withIocProvider(
        <Provider>
          <TestChild />
        </Provider>,
        container
      )
    );

    expect(container.isBound(FirstService)).toBe(true);
    expect(firstServiceActivated).toBe(1);
    expect(firstServiceDeactivated).toBe(0);
    expect(secondServiceActivated).toBe(1);
    expect(firstServiceDeactivated).toBe(0);

    unmount();

    expect(container.isBound(FirstService)).toBe(false);
    expect(firstServiceActivated).toBe(1);
    expect(firstServiceDeactivated).toBe(1);
  });

  it("should accept seeds props", () => {
    const container = mockContainer();
    const Provider = createInjectablesProvider([GenericService]);

    const seeds: TSeedEntries = [
      [FirstService, { count: 5 }],
      [
        SecondService,
        {
          another: 10,
        },
      ],
    ];

    const { unmount } = render(
      withIocProvider(
        <Provider seeds={seeds}>
          <div />
        </Provider>,
        container,
        { global: true }
      )
    );

    expect(container.get(SEEDS_TOKEN)).toEqual(new Map(seeds));
    expect(container.get(SEED_TOKEN)).toEqual({
      global: true,
    });

    unmount();

    expect(container.get(SEEDS_TOKEN)).toEqual(new Map());
    expect(container.get(SEED_TOKEN)).toEqual({
      global: true,
    });
  });
});
