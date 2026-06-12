import { render } from "@testing-library/react";
import { Container, Injectable, OnDeactivation, OnDeprovision, OnProvision } from "@wirestate/core";
import { Component, ReactNode } from "react";

import { ContainerProvider } from "./container-provider";

describe("ContainerProvider provision errors", () => {
  interface ErrorBoundaryProps {
    readonly children?: ReactNode;
  }

  interface ErrorBoundaryState {
    readonly error: unknown;
  }

  class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    public override state: ErrorBoundaryState = { error: null };

    public static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
      return { error };
    }

    public override render(): ReactNode {
      if (this.state.error) {
        return <div role={"alert"}>{String((this.state.error as Error).message ?? this.state.error)}</div>;
      }

      return this.props.children ?? null;
    }
  }

  beforeEach(() => {
    jest.spyOn(window.console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should rollback failed managed provision and surface the error through render", async () => {
    const error = new Error("managed-provision-fail");
    const events: Array<string> = [];
    const onError = jest.fn();

    @Injectable()
    class FirstProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-first");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-first");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-first");
      }
    }

    @Injectable()
    class FailingProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-failing");

        throw error;
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-failing");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-failing");
      }
    }

    @Injectable()
    class ThirdProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-third");
      }

      @OnDeactivation()
      public onDeactivation(): void {
        events.push("deactivation-third");
      }
    }

    const { findByRole } = render(
      <ErrorBoundary>
        <ContainerProvider
          config={{
            bindings: [FirstProvisionService, FailingProvisionService, ThirdProvisionService],
            onError,
          }}
        />
      </ErrorBoundary>
    );

    expect((await findByRole("alert")).textContent).toBe("managed-provision-fail");
    expect(events).not.toContain("provision-third");
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        error,
        message: "@OnProvision failed for",
        instanceName: "FailingProvisionService",
        source: "provider-provision",
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(events).toEqual([
      "provision-first",
      "provision-failing",
      "deprovision-failing",
      "deprovision-first",
      "deactivation-first",
      "deactivation-failing",
      "deactivation-third",
    ]);
  });

  it("should rollback failed external provision without disposing the container", async () => {
    const error = new Error("external-provision-fail");
    const events: Array<string> = [];

    @Injectable()
    class FirstProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-first");
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-first");
      }
    }

    @Injectable()
    class FailingProvisionService {
      @OnProvision()
      public onProvision(): void {
        events.push("provision-failing");

        throw error;
      }

      @OnDeprovision()
      public onDeprovision(): void {
        events.push("deprovision-failing");
      }
    }

    const container: Container = new Container({
      bindings: [FirstProvisionService, FailingProvisionService],
    });

    const unbindAllSpy = jest.spyOn(container, "unbindAll");

    const { findByRole } = render(
      <ErrorBoundary>
        <ContainerProvider container={container} />
      </ErrorBoundary>
    );

    expect((await findByRole("alert")).textContent).toBe("external-provision-fail");
    expect(events).toEqual(["provision-first", "provision-failing", "deprovision-failing", "deprovision-first"]);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(unbindAllSpy).not.toHaveBeenCalled();
    expect(container.has(FirstProvisionService)).toBe(true);
    expect(container.has(FailingProvisionService)).toBe(true);
  });
});
