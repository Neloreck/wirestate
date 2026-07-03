// noinspection JSUnusedLocalSymbols

import { InjectionToken } from "../binding/binding-tokens";
import { Injectable } from "../metadata/metadata-injectable";

import { Container } from "./container";
import { ContainerKernel } from "./container-kernel";

describe("container.bind typings", () => {
  @Injectable()
  class FooService {
    private x = Math.random();
  }

  @Injectable()
  class FooChildService extends FooService {
    private y = Math.random();
  }

  const TOKEN1 = new InjectionToken<string>("token1");
  const TOKEN2 = new InjectionToken<number>("token2");

  it("bind()", () => {
    const container = new ContainerKernel();

    container.bind({ token: FooService, type: "Instance", value: FooChildService });
    container.bind({ token: FooChildService, type: "Instance", value: FooChildService });

    // @ts-expect-error
    container.bind({ token: FooChildService, type: "Instance", value: FooService });

    container.bind({ token: TOKEN1, value: "Foo" });
    container.bind({ token: TOKEN2, value: 42 });

    // @ts-expect-error
    container.bind({ token: TOKEN1, value: 42 });
    // @ts-expect-error
    container.bind({ token: TOKEN2, value: "Foo" });
  });

  it("factory param is the public Container type", () => {
    const container = new Container();

    container.bind({
      token: TOKEN1,
      factory: (container: Container): string => {
        // Unreachable here: the factory is never resolved.
        // Just type assertion.
        container.provision();

        return container.get(TOKEN1);
      },
    });

    // The param is inferred as `Container` without an annotation.
    container.bind({ token: TOKEN2, factory: (container) => container.get(TOKEN2) });
    // @ts-expect-error - the factory result must still match the token type.
    container.bind({ token: TOKEN1, factory: (): number => 42 });
  });

  it("injection tokens", () => {
    const SOME_NUMBER = new InjectionToken<number>("SOME_NUMBER");
    const SOME_STRING = new InjectionToken<string>("SOME_STRING");

    const container = new ContainerKernel();

    container.bind({ token: SOME_NUMBER, value: 3 });
    // @ts-expect-error
    container.bind({ token: SOME_NUMBER, value: "foo" });
    container.bind({ token: SOME_STRING, value: "foo" });
    // @ts-expect-error
    container.bind({ token: SOME_STRING, value: 3 });
  });
});
