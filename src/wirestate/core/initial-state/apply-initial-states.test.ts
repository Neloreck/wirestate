import { Container } from "inversify";

import { GenericService } from "@/fixtures/services/generic-service";
import { applyInitialStates, removeInitialStateEntries } from "@/wirestate/core/initial-state/apply-initial-states";
import { INITIAL_STATE_TOKEN, INITIAL_STATES_TOKEN } from "@/wirestate/core/registry";
import { mockContainer } from "@/wirestate/test-utils/mock-container";
import { TAnyObject } from "@/wirestate/types/general";
import { TInitialStatesMap } from "@/wirestate/types/initial-state";

describe("applyInitialState", () => {
  it("should bind initial state to container when not yet bound", () => {
    const container: Container = mockContainer();

    applyInitialStates(container, { key: "value" }, [["ServiceA", { a: 1 }]]);

    const state: TAnyObject = container.get(INITIAL_STATE_TOKEN);
    const states: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

    expect(state).toEqual({ key: "value" });
    expect(states.has("ServiceA")).toBe(true);
    expect(states.has("ServiceB")).toBe(false);
    expect(states.has(GenericService)).toBe(false);
    expect(states.get("ServiceA")).toEqual({ a: 1 });
  });

  it("should merge targeted entries when initial state already exists", () => {
    const container: Container = mockContainer();

    applyInitialStates(container, {}, [["ServiceA", { a: 1 }]]);
    applyInitialStates(container, {}, [["ServiceB", { b: 2 }]]);
    applyInitialStates(container, {}, [[GenericService, { c: 3 }]]);

    const state: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);
  });

  it("should merge shared state across applications", () => {
    const container: Container = mockContainer();

    applyInitialStates(container, { x: 1 }, []);
    applyInitialStates(container, { y: 2 }, []);

    const state: TInitialStatesMap = container.get(INITIAL_STATE_TOKEN);

    expect(state).toEqual({ y: 2 });
  });

  it("should not rebind states token", () => {
    const container: Container = mockContainer();

    const bindSpy = jest.spyOn(container, "bind");
    const rebindSpy = jest.spyOn(container, "rebind");

    applyInitialStates(container, { initial: true }, [[GenericService, { a: 1 }]]);

    expect(rebindSpy).toHaveBeenCalledTimes(1);
    expect(rebindSpy).toHaveBeenCalledWith(INITIAL_STATE_TOKEN);
    expect(container.get(INITIAL_STATE_TOKEN)).toEqual({ initial: true });
    expect(bindSpy).not.toHaveBeenCalled();

    applyInitialStates(container, { another: true }, [["ServiceA", { a: 1 }]]);

    expect(rebindSpy).toHaveBeenCalledTimes(2);
    expect(rebindSpy).toHaveBeenCalledWith(INITIAL_STATE_TOKEN);
    expect(container.get(INITIAL_STATE_TOKEN)).toEqual({ another: true });
    expect(bindSpy).not.toHaveBeenCalled();
  });
});

describe("removeInitialStateEntries", () => {
  it("should remove specific entries from initial state", () => {
    const container: Container = mockContainer();
    const state: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

    applyInitialStates(container, {}, [
      ["ServiceA", { a: 1 }],
      ["ServiceB", { b: 2 }],
      [GenericService, { c: 3 }],
    ]);

    expect(state.has("ServiceA")).toBe(true);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(true);

    removeInitialStateEntries(container, [
      ["ServiceA", null],
      [GenericService, {}],
    ]);

    expect(state.has("ServiceA")).toBe(false);
    expect(state.has("ServiceB")).toBe(true);
    expect(state.has(GenericService)).toBe(false);
  });

  it("should do nothing when targeted initial state is not bound", () => {
    const container: Container = mockContainer();
    const states: TInitialStatesMap = container.get(INITIAL_STATES_TOKEN);

    expect(states.size).toBe(0);

    removeInitialStateEntries(container, [["ServiceA", null]]);
    expect(states.size).toBe(0);
  });
});
