import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { SEEDS_TOKEN } from "@/wirestate-core/registry";
import { applySeeds } from "@/wirestate-core/seeds/apply-seeds";
import { mockContainer } from "@/wirestate-core/test-utils/mock-container";
import { SeedsMap } from "@/wirestate-core/types/initial-state";

describe("applySeeds", () => {
  it("should bind seeds to container when not yet bound", () => {
    const container: Container = mockContainer();

    applySeeds(container, [["ServiceA", { a: 1 }]]);

    const seeds: SeedsMap = container.get(SEEDS_TOKEN);

    expect(seeds.has("ServiceA")).toBe(true);
    expect(seeds.has("ServiceB")).toBe(false);
    expect(seeds.has(GenericService)).toBe(false);
    expect(seeds.get("ServiceA")).toEqual({ a: 1 });
  });

  it("should merge targeted entries when initial state already exists", () => {
    const container: Container = mockContainer();

    applySeeds(container, [["ServiceA", { a: 1 }]]);
    applySeeds(container, [["ServiceB", { b: 2 }]]);
    applySeeds(container, [[GenericService, { c: 3 }]]);

    const state: SeedsMap = container.get(SEEDS_TOKEN);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);
  });

  it("should not rebind states token", () => {
    const container: Container = mockContainer();

    const bindSpy = jest.spyOn(container, "bind");
    const rebindSpy = jest.spyOn(container, "rebind");

    applySeeds(container, [[GenericService, { a: 1 }]]);

    expect(rebindSpy).not.toHaveBeenCalled();
    expect(bindSpy).not.toHaveBeenCalled();

    applySeeds(container, [["ServiceA", { a: 1 }]]);

    expect(rebindSpy).not.toHaveBeenCalled();
    expect(bindSpy).not.toHaveBeenCalled();
  });
});
