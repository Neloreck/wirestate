/* eslint-disable @typescript-eslint/no-unused-vars */
// noinspection JSUnusedLocalSymbols

import { type FactoryBindingDescriptor, type InstanceBindingDescriptor, type ValueBindingDescriptor } from "./binding";

describe("binding descriptor typings", () => {
  class FooService {
    private x = Math.random();
  }

  class FooChildService extends FooService {
    private y = Math.random();
  }

  class OtherService {
    private z = Math.random();
  }

  it("instance binding descriptor", () => {
    const a: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: FooService };
    const b: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: FooChildService };

    // @ts-expect-error
    const c: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: OtherService };
    const d: InstanceBindingDescriptor<FooChildService> = {
      token: FooChildService,
      type: "Instance",
      // @ts-expect-error
      value: FooService,
    };
    // @ts-expect-error
    const e: InstanceBindingDescriptor<FooService> = { token: FooService, type: "Instance", value: 3 };
    // @ts-expect-error
    const f: InstanceBindingDescriptor<FooService> = { token: 3, type: "Instance", value: 3 };
    // @ts-expect-error
    const g: InstanceBindingDescriptor<string> = { token: String, type: "Instance", value: String };
  });

  it("value binding descriptor", () => {
    const a: ValueBindingDescriptor<FooService> = { token: FooService, value: new FooService() };
    const b: ValueBindingDescriptor<FooService> = { token: FooService, value: new FooChildService() };

    // @ts-expect-error
    const c: ValueBindingDescriptor<FooService> = { token: FooService, value: new OtherService() };
    // @ts-expect-error
    const d: ValueBindingDescriptor<FooChildService> = { token: FooChildService, value: new FooService() };
    // @ts-expect-error
    const e: ValueBindingDescriptor<FooService> = { token: FooService, value: 3 };
    // @ts-expect-error
    const f: ValueBindingDescriptor<FooService> = { token: 3, value: 3 };
  });

  it("factory binding descriptor", () => {
    const a: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new FooService() };
    const b: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new FooChildService() };

    const a2: FactoryBindingDescriptor<FooService> = {
      token: FooService,
      // @ts-expect-error
      factory: async () => new FooService(),
    };

    // @ts-expect-error
    const c: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => new OtherService() };
    const d: FactoryBindingDescriptor<FooChildService> = {
      token: FooChildService,
      // @ts-expect-error
      factory: () => new FooService(),
    };
    // @ts-expect-error
    const e: FactoryBindingDescriptor<FooService> = { token: FooService, factory: () => 3 };
    // @ts-expect-error
    const f: FactoryBindingDescriptor<FooService> = { token: 3, factory: () => 3 };
    // @ts-expect-error
    const g: FactoryBindingDescriptor<string> = { token: String, factory: () => "foo" };
  });
});
