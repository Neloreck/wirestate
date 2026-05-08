import { Container } from "inversify";

import { SEED_TOKEN } from "@/wirestate-core/registry";
import { applySharedSeed } from "@/wirestate-core/seeds/apply-shared-seed";
import { mockContainer } from "@/wirestate-core/test-utils/mock-container";
import { SeedsMap } from "@/wirestate-core/types/initial-state";

describe("applySharedSeed", () => {
  it("should bind initial state to container when not yet bound", () => {
    const container: Container = mockContainer();

    applySharedSeed(container, { key: "value" });

    expect(container.get(SEED_TOKEN)).toEqual({ key: "value" });
  });

  it("should overwrite shared state", () => {
    const container: Container = mockContainer();

    applySharedSeed(container, { x: 1 });
    applySharedSeed(container, { y: 2 });

    const state: SeedsMap = container.get(SEED_TOKEN);

    expect(state).toEqual({ y: 2 });
  });

  it("should not rebind states token", () => {
    const container: Container = mockContainer();

    const bindSpy = jest.spyOn(container, "bind");
    const rebindSpy = jest.spyOn(container, "rebind");

    applySharedSeed(container, { initial: true });

    expect(rebindSpy).toHaveBeenCalledTimes(1);
    expect(rebindSpy).toHaveBeenCalledWith(SEED_TOKEN);
    expect(container.get(SEED_TOKEN)).toEqual({ initial: true });
    expect(bindSpy).not.toHaveBeenCalled();

    applySharedSeed(container, { another: true });

    expect(rebindSpy).toHaveBeenCalledTimes(2);
    expect(rebindSpy).toHaveBeenCalledWith(SEED_TOKEN);
    expect(container.get(SEED_TOKEN)).toEqual({ another: true });
    expect(bindSpy).not.toHaveBeenCalled();
  });
});
