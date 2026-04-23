import { render, cleanup } from "@testing-library/react";
import { Container } from "inversify";

import { IocProvider } from "@/wirestate/core/provision/ioc-provider";
import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
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

  afterEach(() => {
    cleanup();
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
});
