import { Container, createContainer, SeedEntries } from "@wirestate/core";
import { InjectableEntries } from "@wirestate/core/types/provision";
import { createElement, type ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import { Optional } from "../types/general";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

/**
 * Child-container inputs controlled by {@link SubContainerProvider}.
 *
 * @internal
 */
interface SubContainerSource {
  readonly parent: Container;
  readonly seeds?: SeedEntries;
  readonly entries: InjectableEntries;
}

/**
 * Active child-container state stored in component state.
 */
interface SubContainerState {
  readonly container: Container;
  readonly source: SubContainerSource;
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
   * Seed changes intentionally do not recreate the child container, because
   * seed arrays are commonly passed inline. Pass a React `key` to force a
   * remount when you need to re-seed the subtree.
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
 * The provider owns the child container. It recreates on parent or `entries`
 * changes. Seed changes are intentionally ignored for reuse decisions; pass a
 * React `key` when new seeds should create a new scoped container.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the child container.
 */
export function SubContainerProvider(props: SubContainerProviderProps) {
  const parent: Container = useContainer();
  const source: SubContainerSource = {
    parent,
    entries: props.entries,
    seeds: props.seeds,
  };

  const pendingDestructionRef = useRef<Optional<Map<Container, ReturnType<typeof setTimeout>>>>(null);

  const [state, setState] = useState<SubContainerState>(() => ({
    container: createContainer({
      entries: source.entries,
      parent: source.parent,
      seeds: source.seeds,
    }),
    source,
  }));

  useEffect(() => {
    let pending = pendingDestructionRef.current;

    if (!pending) {
      pending = new Map();
      pendingDestructionRef.current = pending;
    }

    const timeout = pending.get(state.container) ?? null;

    if (timeout) {
      clearTimeout(timeout);
      pending.delete(state.container);
    }

    const needsReplacement: boolean =
      state.source.parent !== source.parent || !shallowEqualArrays(state.source.entries, source.entries);

    if (needsReplacement) {
      setState({
        container: createContainer({
          entries: source.entries,
          parent: source.parent,
          seeds: source.seeds,
        }),
        source,
      });
    }

    return () => {
      const container = state.container;
      const destruction = pendingDestructionRef.current!;

      if (destruction.has(container)) {
        return;
      }

      destruction.set(
        container,
        setTimeout(() => {
          destruction.delete(container);
          container.unbindAll();
        }, 0)
      );
    };
  }, [state, source.entries, source.parent]);

  return createElement(ContainerReactContext.Provider, { value: state.container }, props.children ?? null);
}
