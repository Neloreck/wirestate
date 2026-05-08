import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";

import { SEEDS_TOKEN } from "@/wirestate-core/registry";
import { applySeeds } from "@/wirestate-core/seeds/apply-seeds";
import { unapplySeeds } from "@/wirestate-core/seeds/unapply-seeds";
import { mockContainer } from "@/wirestate-core/test-utils/mock-container";
import { SeedsMap } from "@/wirestate-core/types/initial-state";

describe("unapplySeeds", () => {
  it("should remove specific entries from initial state", () => {
    const container: Container = mockContainer();
    const state: SeedsMap = container.get(SEEDS_TOKEN);

    applySeeds(container, [
      ["ServiceA", { a: 1 }],
      ["ServiceB", { b: 2 }],
      [GenericService, { c: 3 }],
    ]);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);

    unapplySeeds(container, [
      ["ServiceA", null],
      [GenericService, {}],
    ]);

    expect(state.has("ServiceA")).toBe(false);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(false);
  });

  it("should do nothing when targeted initial state is not bound", () => {
    const container: Container = mockContainer();
    const seeds: SeedsMap = container.get(SEEDS_TOKEN);

    expect(seeds.size).toBe(0);

    unapplySeeds(container, [["ServiceA", null]]);
    expect(seeds.size).toBe(0);
  });
});
