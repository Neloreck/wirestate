import { getPrototypeChainMetadata } from "./metadata-prototype-chain";

describe("getPrototypeChainMetadata", () => {
  const metadataRegistry = new WeakMap<object, unknown>();

  it("should return constructor metadata from derived class to base class", () => {
    class BaseService {}

    class MiddleService extends BaseService {}

    class ChildService extends MiddleService {}

    metadataRegistry.set(BaseService, "base");
    metadataRegistry.set(MiddleService, "middle");
    metadataRegistry.set(ChildService, "child");

    expect(getPrototypeChainMetadata(new ChildService(), metadataRegistry)).toEqual(["child", "middle", "base"]);
  });

  it("should skip constructors without metadata", () => {
    class BaseService {}

    class MiddleService extends BaseService {}

    class ChildService extends MiddleService {}

    metadataRegistry.set(BaseService, "base");
    metadataRegistry.set(ChildService, "child");

    expect(getPrototypeChainMetadata(new ChildService(), metadataRegistry)).toEqual(["child", "base"]);
  });

  it("should preserve metadata values that are present but falsy", () => {
    class BaseService {}

    class MiddleService extends BaseService {}

    class ChildService extends MiddleService {}

    metadataRegistry.set(BaseService, null);
    metadataRegistry.set(MiddleService, "");
    metadataRegistry.set(ChildService, false);

    expect(getPrototypeChainMetadata(new ChildService(), metadataRegistry)).toEqual([false, "", null]);
  });

  it("should ignore Object constructor metadata", () => {
    class BaseService {}

    class ChildService extends BaseService {}

    metadataRegistry.set(Object, "object");

    expect(getPrototypeChainMetadata(BaseService, metadataRegistry)).toEqual([]);
    expect(getPrototypeChainMetadata(ChildService, metadataRegistry)).toEqual([]);
    expect(getPrototypeChainMetadata({}, metadataRegistry)).toEqual([]);
    expect(getPrototypeChainMetadata(Object.prototype, metadataRegistry)).toEqual([]);
  });

  it("should return an empty array when no constructor metadata exists", () => {
    class TestService {}

    expect(getPrototypeChainMetadata(new TestService(), new WeakMap<object, string>())).toEqual([]);
  });
});
