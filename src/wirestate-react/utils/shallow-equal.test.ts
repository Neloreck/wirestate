import { shallowEqualActivation, shallowEqualArrays, shallowEqualObjects } from "./shallow-equal";

describe("shallowEqualObjects", () => {
  it("should return true for the same object reference", () => {
    const value = { count: 1 };

    expect(shallowEqualObjects(value, value)).toBe(true);
  });

  it("should return true for objects with the same keys and values", () => {
    expect(shallowEqualObjects({ count: 1, title: "first" }, { title: "first", count: 1 })).toBe(true);
  });

  it("should return false when one object is missing", () => {
    expect(shallowEqualObjects({ count: 1 }, null)).toBe(false);
    expect(shallowEqualObjects(undefined, { count: 1 })).toBe(false);
  });

  it("should return false for different keys", () => {
    expect(shallowEqualObjects({ count: 1 }, { count: 1, title: undefined })).toBe(false);
  });

  it("should return false for different values", () => {
    expect(shallowEqualObjects({ count: 1 }, { count: 2 })).toBe(false);
  });

  it("should compare object values by reference", () => {
    const seed = { count: 1 };

    expect(shallowEqualObjects({ seed }, { seed })).toBe(true);
    expect(shallowEqualObjects({ seed }, { seed: { count: 1 } })).toBe(false);
  });
});

describe("shallowEqualArrays", () => {
  it("should return true for the same array reference", () => {
    const values: ReadonlyArray<string> = ["first"];

    expect(shallowEqualArrays(values, values)).toBe(true);
  });

  it("should return true for arrays with the same values in the same order", () => {
    expect(shallowEqualArrays([1, "first", true], [1, "first", true])).toBe(true);
  });

  it("should return false when one array is missing", () => {
    expect(shallowEqualArrays([1], null)).toBe(false);
    expect(shallowEqualArrays(undefined, [1])).toBe(false);
  });

  it("should return false for arrays with different lengths", () => {
    expect(shallowEqualArrays([1, 2], [1])).toBe(false);
  });

  it("should return false for arrays with different order", () => {
    expect(shallowEqualArrays(["first", "second"], ["second", "first"])).toBe(false);
  });

  it("should compare array items by reference", () => {
    const entry = { id: "TOKEN" };

    expect(shallowEqualArrays([entry], [entry])).toBe(true);
    expect(shallowEqualArrays([entry], [{ id: "TOKEN" }])).toBe(false);
  });
});

describe("shallowEqualActivation", () => {
  class FirstService {}

  class SecondService {}

  it("should compare boolean activation values by identity", () => {
    expect(shallowEqualActivation(true, true)).toBe(true);
    expect(shallowEqualActivation(false, false)).toBe(true);
    expect(shallowEqualActivation(true, false)).toBe(false);
    expect(shallowEqualActivation(true, null)).toBe(false);
    expect(shallowEqualActivation(true, undefined)).toBe(false);
    expect(shallowEqualActivation(false, null)).toBe(false);
    expect(shallowEqualActivation(false, undefined)).toBe(false);
  });

  it("should compare activation arrays shallowly", () => {
    expect(shallowEqualActivation([FirstService, SecondService], [FirstService, SecondService])).toBe(true);
    expect(shallowEqualActivation([FirstService, SecondService], [SecondService, FirstService])).toBe(false);
  });

  it("should return false for boolean and array activation values", () => {
    expect(shallowEqualActivation(true, [FirstService])).toBe(false);
    expect(shallowEqualActivation([FirstService], false)).toBe(false);
  });

  it("should return true when both activation values are missing", () => {
    expect(shallowEqualActivation(undefined, undefined)).toBe(true);
    expect(shallowEqualActivation(null, null)).toBe(true);
  });
});
