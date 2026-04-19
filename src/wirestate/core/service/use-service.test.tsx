import { mount } from "enzyme";
import { Container } from "inversify";

import { ErrorLogBoundary } from "@/fixtures/components/error-log-boundary";
import { GenericService } from "@/fixtures/services/generic-service";
import { useIocContext } from "@/wirestate/core/provision/useIocContext";
import { AbstractService } from "@/wirestate/core/service/abstract-service";
import { useService } from "@/wirestate/core/service/use-service";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { withIocProvider } from "@/wirestate/test-utils/with-ioc-provider";
import { TServiceClass } from "@/wirestate/types/services";

describe("useService", () => {
  const TestComponent = ({ token = GenericService as TServiceClass }) => {
    const service = useService(token);

    return <div id={"service-name"}>{service.constructor.name || String(service.constructor.name)}</div>;
  };

  const TestComponentRevisionTrigger = () => {
    const { setRevision } = useIocContext();

    return (
      <button id={"revision-increment"} onClick={() => setRevision((r) => r + 1)}>
        Increment revision
      </button>
    );
  };

  it("should crash if service is not resolved", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(
      withIocProvider(
        <ErrorLogBoundary>
          <TestComponent />
        </ErrorLogBoundary>
      )
    );

    consoleSpy.mockRestore();

    expect(wrapper.find("#error-message").text()).toMatch(`No bindings found for service: "${GenericService.name}".`);
  });

  it("should resolve bound service from container", () => {
    const container: Container = mockContainer({
      services: [GenericService],
    });
    const wrapper = mount(withIocProvider(<TestComponent />, container));

    expect(wrapper.find("#service-name").text()).toBe("GenericService");
  });

  it("should re-resolve service when revision changes", () => {
    const container: Container = mockContainer({
      services: [GenericService],
    });

    const originalGet = container.get.bind(container);
    let resolveCount: number = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === GenericService) {
        resolveCount++;
      }

      return originalGet(token);
    });

    const wrapper = mount(
      withIocProvider(
        <ErrorLogBoundary>
          <TestComponent />
          <TestComponentRevisionTrigger />
        </ErrorLogBoundary>,
        container
      )
    );

    expect(resolveCount).toBe(1);

    wrapper.find("#revision-increment").simulate("click");
    expect(resolveCount).toBe(2);

    wrapper.find("#revision-increment").simulate("click");
    expect(resolveCount).toBe(3);
  });

  it("should throw error when used outside of IocProvider", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const wrapper = mount(
      <ErrorLogBoundary>
        <TestComponent />
      </ErrorLogBoundary>
    );

    consoleSpy.mockRestore();

    expect(wrapper.find("#error-message").text()).toMatch(
      "Trying to access IOC context from React subtree not wrapped in <IocProvider>."
    );
  });

  it("should memoize service instance", () => {
    const container: Container = mockContainer({
      services: [GenericService],
    });

    const originalGet = container.get.bind(container);
    let resolveCount = 0;

    jest.spyOn(container, "get").mockImplementation((token) => {
      if (token === GenericService) {
        resolveCount++;
      }

      return originalGet(token);
    });

    const wrapper = mount(withIocProvider(<TestComponent />, container));

    expect(resolveCount).toBe(1);

    for (let i = 0; i < 10; i++) {
      wrapper.setProps({ children: <TestComponent /> });
      wrapper.update();
    }

    // Should NOT re-resolve because container and revision didn't change.
    expect(resolveCount).toBe(1);
  });

  it("should re-resolve when token changes", () => {
    class AnotherService extends AbstractService {}

    const container: Container = mockContainer({
      services: [GenericService, AnotherService],
    });

    const wrapper = mount(withIocProvider(<TestComponent token={GenericService} />, container));

    expect(wrapper.find("#service-name").text()).toBe("GenericService");

    wrapper.setProps({ children: <TestComponent token={AnotherService} /> });
    wrapper.update();

    expect(wrapper.find("#service-name").text()).toBe("AnotherService");
  });
});
