import { render } from "@testing-library/react";
import { Container } from "inversify";

import { ErrorLogBoundary } from "@/fixtures/components/error-log-boundary";
import { IocProvider } from "@/wirestate-react/provision/ioc-provider";
import { useIocContext } from "@/wirestate-react/provision/use-ioc-context";
import { SEED_TOKEN } from "@/wirestate/core/registry";
import { TAnyObject } from "@/wirestate/types/general";

describe("IocProvider", () => {
  function Consumer() {
    const { container, revision } = useIocContext();

    return (
      <div>
        <span data-testid={"revision"}>{revision ?? "?"}</span>
        <span data-testid={"container-id"}>{(container as TAnyObject).id ?? "?"}</span>
      </div>
    );
  }

  beforeEach(() => {
    jest.spyOn(window.console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should provide an owned container if none is passed", () => {
    const { getByTestId } = render(
      <IocProvider>
        <Consumer />
      </IocProvider>
    );

    expect(getByTestId("container-id").textContent).toBe("?");
    expect(getByTestId("revision").textContent).toBe("1");
  });

  it("should use the provided external container", () => {
    const container: Container = new Container();

    (container as TAnyObject).id = "external-id";

    const { getByTestId } = render(
      <IocProvider container={container}>
        <Consumer />
      </IocProvider>
    );

    expect(getByTestId("container-id").textContent).toBe("external-id");
  });

  it("should apply seed to external container", () => {
    const container: Container = new Container();
    const seed: TAnyObject = { key: "value" };

    expect(container.isBound(SEED_TOKEN)).toBe(false);

    render(
      <IocProvider container={container} seed={seed}>
        <Consumer />
      </IocProvider>
    );

    expect(container.get(SEED_TOKEN)).toEqual(seed);
  });

  it("should throw an error if external container stopped provision", async () => {
    const container: Container = new Container();

    (container as TAnyObject).id = "external-id";

    const { getByTestId, rerender } = render(
      <ErrorLogBoundary>
        <IocProvider container={container}>
          <Consumer />
        </IocProvider>
      </ErrorLogBoundary>
    );

    expect(getByTestId("container-id").textContent).toBe("external-id");

    rerender(
      <ErrorLogBoundary>
        <IocProvider>
          <Consumer />
        </IocProvider>
      </ErrorLogBoundary>
    );

    expect(getByTestId("error-message").textContent).toBe("IocProvider failed to resolve a container instance.");
  });
});
