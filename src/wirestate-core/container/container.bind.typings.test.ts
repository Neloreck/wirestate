// noinspection JSUnusedLocalSymbols

import { InjectionToken } from "../binding/binding-tokens";
import { Injectable } from "../metadata/metadata-injectable";

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
