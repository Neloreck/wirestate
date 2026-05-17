import { shallowEqualArrays } from "./shallow-equal-arrays";

describe("shallowEqualArrays", () => {
  it("should return true for arrays with same values in same order", () => {
    expect(shallowEqualArrays([1, "a", true], [1, "a", true])).toBe(true);
  });

  it("should return false for arrays with different lengths", () => {
    expect(shallowEqualArrays([1, 2], [1])).toBe(false);
  });

  it("should return false for arrays with same length but different values", () => {
    expect(shallowEqualArrays([1, 2, 3], [1, 9, 3])).toBe(false);
  });
});
