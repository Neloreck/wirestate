import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { applySeeds } from "@/wirestate/core/container/apply-seeds";
import { unapplySeeds } from "@/wirestate/core/container/unapply-seeds";
import { SEEDS_TOKEN } from "@/wirestate/core/registry";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { TSeedsMap } from "@/wirestate/types/initial-state";

describe("unapplySeeds", () => {
  it("should remove specific entries from initial state", () => {
    const container: Container = mockContainer();
    const state: TSeedsMap = container.get(SEEDS_TOKEN);

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
    const seeds: TSeedsMap = container.get(SEEDS_TOKEN);

    expect(seeds.size).toBe(0);

    unapplySeeds(container, [["ServiceA", null]]);
    expect(seeds.size).toBe(0);
  });
});
