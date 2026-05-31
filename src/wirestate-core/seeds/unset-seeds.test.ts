import { GenericService } from "@/fixtures/services/generic-service";

import { Container } from "../alias";
import { createContainer } from "../container/create-container";
import { SEEDS_TOKEN } from "../registry";
import { SeedsMap } from "../types/seeds";

import { setSeeds } from "./set-seeds";
import { unsetSeeds } from "./unset-seeds";

describe("unsetSeeds", () => {
  it("should remove specific bindings from initial state", () => {
    const container: Container = createContainer();
    const state: SeedsMap = container.get(SEEDS_TOKEN);

    setSeeds(container, [
      ["ServiceA", { a: 1 }],
      ["ServiceB", { b: 2 }],
      [GenericService, { c: 3 }],
    ]);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);

    unsetSeeds(container, [
      ["ServiceA", null],
      [GenericService, {}],
    ]);

    expect(state.has("ServiceA")).toBe(false);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(false);
  });

  it("should do nothing when targeted initial state is not bound", () => {
    const container: Container = createContainer();
    const seeds: SeedsMap = container.get(SEEDS_TOKEN);

    expect(seeds.size).toBe(0);

    unsetSeeds(container, [["ServiceA", null]]);
    expect(seeds.size).toBe(0);
  });
});
