import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../alias";
import { mockContainer } from "../test-utils/mock-container";
import { SeedsMap } from "../types/seeds";

import { setSeeds } from "./set-seeds";
import { SEEDS_TOKEN } from "./tokens";

describe("setSeeds", () => {
  it("should bind seeds to container when not yet bound", () => {
    const container: Container = mockContainer();

    setSeeds(container, [["ServiceA", { a: 1 }]]);

    const seeds: SeedsMap = container.get(SEEDS_TOKEN);

    expect(seeds.has("ServiceA")).toBe(true);
    expect(seeds.has("ServiceB")).toBe(false);
    expect(seeds.has(GenericService)).toBe(false);
    expect(seeds.get("ServiceA")).toEqual({ a: 1 });
  });

  it("should merge targeted bindings when initial state already exists", () => {
    const container: Container = mockContainer();

    setSeeds(container, [["ServiceA", { a: 1 }]]);
    setSeeds(container, [["ServiceB", { b: 2 }]]);
    setSeeds(container, [[GenericService, { c: 3 }]]);

    const state: SeedsMap = container.get(SEEDS_TOKEN);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);
  });

  it("should not rebind states token", () => {
    const container: Container = mockContainer();

    const bindSpy = jest.spyOn(container, "bind");
    const rebindSpy = jest.spyOn(container, "rebind");

    setSeeds(container, [[GenericService, { a: 1 }]]);

    expect(rebindSpy).not.toHaveBeenCalled();
    expect(bindSpy).not.toHaveBeenCalled();

    setSeeds(container, [["ServiceA", { a: 1 }]]);

    expect(rebindSpy).not.toHaveBeenCalled();
    expect(bindSpy).not.toHaveBeenCalled();
  });
});
