import { render, cleanup } from "@testing-library/react";
import { Container, injectable } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { OnActivated, OnDeactivation, SEED, SeedEntries, SEEDS, WirestateError } from "@/wirestate-core";
import { mockContainer } from "@/wirestate-core/test-utils";
import { ERROR_CODE_INVALID_CONTEXT } from "@/wirestate-react/error/error-code";
import { createInjectablesProvider } from "@/wirestate-react/provision/create-injectables-provider";
import { useInjection } from "@/wirestate-react/provision/use-injection";
import { withIocProvider } from "@/wirestate-react/test-utils/with-ioc-provider";

describe("createInjectablesProvider", () => {
  let firstServiceActivated: number = 0;
  let firstServiceDeactivated: number = 0;
  let secondServiceActivated: number = 0;
  let secondServiceDeactivated: number = 0;

  @injectable()
  class FirstService {
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
  class SecondService {
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

    const seeds: SeedEntries = [
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

    expect(container.get(SEEDS)).toEqual(new Map(seeds));
    expect(container.get(SEED)).toEqual({
      global: true,
    });

    unmount();

    expect(container.get(SEEDS)).toEqual(new Map());
    expect(container.get(SEED)).toEqual({
      global: true,
    });
  });

  it("should throw if rendered outside IocProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const Provider = createInjectablesProvider([FirstService, SecondService]);

    expect(() => render(<Provider>child</Provider>)).toThrow(
      new WirestateError(
        ERROR_CODE_INVALID_CONTEXT,
        "<InjectablesProvider> must be rendered inside an <IocProvider> React subtree."
      )
    );

    consoleSpy.mockRestore();
  });
});
