import { Container } from "../alias";
import { mockContainer } from "../test-utils/mock-container";
import { SeedsMap } from "../types/seeds";

import { setSharedSeed } from "./set-shared-seed";
import { SEED_TOKEN } from "./tokens";

describe("setSharedSeed", () => {
  it("should bind initial state to container when not yet bound", () => {
    const container: Container = mockContainer();

    setSharedSeed(container, { key: "value" });

    expect(container.get(SEED_TOKEN)).toEqual({ key: "value" });
  });

  it("should overwrite shared state", () => {
    const container: Container = mockContainer();

    setSharedSeed(container, { x: 1 });
    setSharedSeed(container, { y: 2 });

    const state: SeedsMap = container.get(SEED_TOKEN);

    expect(state).toEqual({ y: 2 });
  });

  it("should not rebind states token", () => {
    const container: Container = mockContainer();

    const bindSpy = jest.spyOn(container, "bind");
    const rebindSpy = jest.spyOn(container, "rebind");

    setSharedSeed(container, { initial: true });

    expect(rebindSpy).toHaveBeenCalledTimes(1);
    expect(rebindSpy).toHaveBeenCalledWith(SEED_TOKEN);
    expect(container.get(SEED_TOKEN)).toEqual({ initial: true });
    expect(bindSpy).not.toHaveBeenCalled();

    setSharedSeed(container, { another: true });

    expect(rebindSpy).toHaveBeenCalledTimes(2);
    expect(rebindSpy).toHaveBeenCalledWith(SEED_TOKEN);
    expect(container.get(SEED_TOKEN)).toEqual({ another: true });
    expect(bindSpy).not.toHaveBeenCalled();
  });
});
