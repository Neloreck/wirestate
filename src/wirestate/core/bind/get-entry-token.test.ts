import { GenericService } from "@/fixtures/services/generic-service";
import { getEntryToken } from "@/wirestate/core/bind/get-entry-token";

describe("getEntryToken", () => {
  it("should return the function itself if the entry is a function", () => {
    expect(getEntryToken(GenericService)).toBe(GenericService);
  });

  it("should return the id if the entry is a descriptor with value", () => {
    expect(getEntryToken({ id: "test-value", value: { a: 1 } })).toBe("test-value");
  });

  it("should return the id if the entry is a descriptor with factory", () => {
    expect(getEntryToken({ id: "test-factory", factory: () => "test" })).toBe("test-factory");
  });

  it("should return the symbol id if the entry is a descriptor with symbol id", () => {
    const id: unique symbol = Symbol("my-service");

    expect(getEntryToken({ id, value: GenericService })).toBe(id);
  });
});
