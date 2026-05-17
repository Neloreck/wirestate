import { applySeeds, bindEntry, Container, SeedEntries } from "@wirestate/core";
import { InjectableEntries } from "@wirestate/core/types/privision";
import { createElement, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import { Maybe, Optional } from "../types/general";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

/**
 * Runtime snapshot currently exposed by {@link SubContainerProvider}.
 *
 * @internal
 */
interface SubContainerState {
  readonly parent: Container;
  readonly entries: InjectableEntries;
  readonly container: Container;
  readonly value: { value: Container };
}

/**
 * Props accepted by {@link SubContainerProvider}.
 *
 * @group Provision
 */
export interface SubContainerProviderProps {
  /**
   * Targeted seeds applied before entries are bound.
   *
   * @remarks
   * Seed changes do not recreate the child container. Pass a React `key` to
   * force a remount when you need to re-seed the subtree.
   */
  readonly seeds?: SeedEntries;

  /**
   * Services or descriptors bound inside the child container.
   *
   * @remarks
   * The child container is recreated when this array changes by shallow
   * comparison or when the parent container changes.
   */
  readonly entries: InjectableEntries;

  /**
   * React subtree that receives the child container.
   */
  readonly children?: ReactNode;
}

/**
 * Provides a child container derived from the nearest parent container.
 *
 * @remarks
 * The provider owns the child container. It disposes the previous child before
 * exposing a replacement, recreates on parent or `entries` changes, and revives
 * a cleaned child after React development remount cleanup.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the child container.
 */
export function SubContainerProvider(props: SubContainerProviderProps) {
  const parent: Container = useContainer();

  const stateRef = useRef<Optional<SubContainerState>>(null);
  const disposedRef = useRef<WeakSet<Container>>(new WeakSet<Container>());
  const [, forceUpdate] = useState<number>(0);

  /**
   * Disposes a {@link Container} once.
   *
   * @internal
   *
   * @param container - Target container to dispose.
   */
  function disposeOnce(container: Container): void {
    if (disposedRef.current.has(container)) {
      return;
    }

    dbg.info(prefix(__filename), "Provider unbinding container:", {
      container,
      seeds: props.seeds,
      entries: props.entries,
    });

    container.unbindAll();
    disposedRef.current.add(container);
  }

  stateRef.current = reconcileSubContainerState(stateRef.current, parent, props, disposeOnce);

  const state: SubContainerState = stateRef.current as SubContainerState;

  useEffect(() => {
    dbg.info(prefix(__filename), "Provider mounted:", {
      container: state.container,
      seeds: props.seeds,
      entries: props.entries,
    });

    if (reviveSubContainer(stateRef, disposedRef.current, props.seeds)) {
      forceUpdate((it: number) => it + 1);
    }

    return () => disposeOnce(state.container);
  }, [state]);

  return createElement(ContainerReactContext.Provider, state.value, props.children ?? null);
}

/**
 * Selects the child-container state that should be exposed for this render.
 *
 * @param current - Previously exposed state, if any.
 * @param parent - Current parent container from context.
 * @param props - Current provider props.
 * @param dispose - Idempotent disposal callback for child containers.
 * @returns Existing or replacement child-container state.
 */
function reconcileSubContainerState(
  current: Optional<SubContainerState>,
  parent: Container,
  props: SubContainerProviderProps,
  dispose: (container: Container) => void
): SubContainerState {
  if (current && current.parent === parent && shallowEqualArrays(props.entries, current.entries)) {
    return current;
  }

  if (current) {
    dispose(current.container);
  }

  return createSubContainer(parent, props.entries, props.seeds);
}

/**
 * Creates a child container, applies seeds, and binds entries.
 *
 * @param parent - Parent container used for hierarchical resolution.
 * @param entries - Entries to bind in the child container.
 * @param seeds - Optional targeted seeds applied before binding.
 * @returns Child-container state ready for context.
 */
function createSubContainer(
  parent: Container,
  entries: InjectableEntries,
  seeds: Maybe<SeedEntries>
): SubContainerState {
  const container: Container = new Container({
    defaultScope: "Singleton",
    parent,
  });

  dbg.info(prefix(__filename), "Constructing new provider:", {
    parent,
    container,
    seeds,
    entries,
  });

  if (seeds) {
    applySeeds(container, seeds);
  }

  for (const entry of entries) {
    bindEntry(container, entry);
  }

  return {
    parent,
    entries,
    container,
    value: { value: container },
  };
}

/**
 * Recreates a child container that was disposed by development remount cleanup.
 *
 * @param stateRef - Mutable child-container state ref.
 * @param stateRef.current - Current child-container state.
 * @param disposed - Containers already disposed by this provider.
 * @param seeds - Current seed entries.
 * @returns `true` when a fresh child container was created.
 */
function reviveSubContainer(
  stateRef: { current: Optional<SubContainerState> },
  disposed: WeakSet<Container>,
  seeds: Maybe<SeedEntries>
): boolean {
  const state: Optional<SubContainerState> = stateRef.current;

  if (!state || !disposed.has(state.container)) {
    return false;
  }

  dbg.info(prefix(__filename), "Provider recreating cleaned container:", {
    parent: state.parent,
    container: state.container,
    seeds,
    entries: state.entries,
  });

  stateRef.current = createSubContainer(state.parent, state.entries, seeds);

  return true;
}
