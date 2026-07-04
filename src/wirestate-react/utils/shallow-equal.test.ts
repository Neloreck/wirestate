import { shallowEqualArrays } from "./shallow-equal";

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
    const entry = { token: "TOKEN" };

    expect(shallowEqualArrays([entry], [entry])).toBe(true);
    expect(shallowEqualArrays([entry], [{ token: "TOKEN" }])).toBe(false);
  });
});
