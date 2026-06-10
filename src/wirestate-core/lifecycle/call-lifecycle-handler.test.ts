import { Container, Injectable } from "../alias";
import { createContainer } from "../container/create-container";

import { callLifecycleHandler } from "./call-lifecycle-handler";

describe("callLifecycleHandler", () => {
  it("should call lifecycle handler with the instance as this", () => {
    @Injectable()
    class TestService {
      public value: string = "initial";

      public onLifecycle(): void {
        this.value = "called";
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ bindings: [TestService], onError });
    const instance: TestService = container.get(TestService);

    callLifecycleHandler({
      container,
      instance,
      methodName: "onLifecycle",
      name: "@OnTest",
      source: "instance-activation",
    });

    expect(instance.value).toBe("called");
    expect(onError).not.toHaveBeenCalled();
  });

  it("should ignore non-function lifecycle properties", () => {
    @Injectable()
    class TestService {
      public onLifecycle: string = "not-a-function";
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });

    callLifecycleHandler({
      container,
      instance: new TestService(),
      methodName: "onLifecycle",
      name: "@OnTest",
      source: "instance-activation",
    });

    expect(onError).not.toHaveBeenCalled();
  });

  it("should report synchronous failures without rethrowing by default", () => {
    const error = new Error("sync-fail");

    @Injectable()
    class TestService {
      public onLifecycle(): void {
        throw error;
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });
    const instance = new TestService();

    expect(() =>
      callLifecycleHandler({
        container,
        details: ["CustomService", "onLifecycle"],
        instance,
        instanceName: "CustomService",
        methodName: "onLifecycle",
        name: "@OnTest",
        source: "instance-deactivation",
      })
    ).not.toThrow();

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["CustomService", "onLifecycle"],
        error,
        instance,
        instanceName: "CustomService",
        message: "@OnTest failed",
        methodName: "onLifecycle",
        source: "instance-deactivation",
      })
    );
  });

  it("should report and rethrow synchronous failures when rethrowSync is true", () => {
    const error = new Error("sync-rethrow");

    @Injectable()
    class TestService {
      public onLifecycle(): void {
        throw error;
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });
    const instance = new TestService();

    expect(() =>
      callLifecycleHandler({
        container,
        instance,
        methodName: "onLifecycle",
        name: "@OnTest",
        rethrowSync: true,
        source: "provider-provision",
        syncFailureMessage: "@OnTest failed for",
      })
    ).toThrow(error);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        error,
        message: "@OnTest failed for",
        methodName: "onLifecycle",
        source: "provider-provision",
      })
    );
  });

  it("should report asynchronous rejections", async () => {
    const error = new Error("async-fail");

    @Injectable()
    class TestService {
      public async onLifecycle(): Promise<void> {
        throw error;
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });
    const instance = new TestService();

    callLifecycleHandler({
      container,
      details: ["AsyncService", "onLifecycle"],
      instance,
      instanceName: "AsyncService",
      methodName: "onLifecycle",
      name: "@OnTest",
      source: "provider-deprovision",
    });

    expect(onError).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        container,
        details: ["AsyncService", "onLifecycle"],
        error,
        instance,
        instanceName: "AsyncService",
        message: "@OnTest rejected",
        methodName: "onLifecycle",
        source: "provider-deprovision",
      })
    );
  });

  it("should use instance constructor details when diagnostics are not provided", () => {
    const error = new Error("default-details");

    @Injectable()
    class TestService {
      public onLifecycle(): void {
        throw error;
      }
    }

    const onError = jest.fn();
    const container: Container = createContainer({ onError });
    const instance = new TestService();

    callLifecycleHandler({
      container,
      instance,
      methodName: "onLifecycle",
      name: "@OnTest",
      source: "instance-activation",
    });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        details: ["TestService", "onLifecycle"],
        instanceName: "TestService",
      })
    );
  });
});
