import { render } from "@testing-library/react";
import { Container } from "@wirestate/core";

import { AnyObject } from "../types/general";

import { IocProvider } from "./ioc-provider";
import { useIocContext } from "./use-ioc-context";

describe("IocProvider", () => {
  function Consumer() {
    const { container, revision } = useIocContext();

    return (
      <div>
        <span data-testid={"revision"}>{revision ?? "?"}</span>
        <span data-testid={"container-id"}>{(container as AnyObject).id ?? "?"}</span>
      </div>
    );
  }

  beforeEach(() => {
    jest.spyOn(window.console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should use the provided external container", () => {
    const container: Container = new Container();

    (container as AnyObject).id = "external-id";

    const { getByTestId } = render(
      <IocProvider container={container}>
        <Consumer />
      </IocProvider>
    );

    expect(getByTestId("container-id").textContent).toBe("external-id");
  });
});
