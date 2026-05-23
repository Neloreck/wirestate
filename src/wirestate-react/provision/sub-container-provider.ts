import { Container, ContainerActivation, createContainer, SeedEntries } from "@wirestate/core";
import { InjectableEntries } from "@wirestate/core/types/provision";
import { createElement, type ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import {
  provisionContainer,
  ProvisionLifecycle,
  retainContainer,
  scheduleContainerDestruction,
} from "../services/provision-lifecycle";
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
  readonly activate: ContainerActivation;
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
   * Services to resolve immediately.
   *
   * @remarks
   * Pass an array to activate specific services. Listed services must also be
   * present in the `entries` array. Pass `true` to activate all provided entries.
   */
  readonly activate?: ContainerActivation;

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
  const lifecycleRef = useRef<Optional<ProvisionLifecycle>>(null);
  const latestSourceRef = useRef<SubContainerSource>(null);

  const parent: Container = useContainer();

  const source: SubContainerSource = {
    parent: parent,
    activate: props.activate ?? true,
    entries: props.entries,
    seeds: props.seeds,
  };

  const [state, setState] = useState<SubContainerState>(() => ({
    container: createContainer(source),
    source,
  }));

  const needsReplacement: boolean =
    state.source.parent !== source.parent || !shallowEqualArrays(state.source.entries, source.entries);

  latestSourceRef.current = source;

  useEffect(() => {
    const lifecycle: ProvisionLifecycle = (lifecycleRef.current ||= {
      pendingDestruction: new Map(),
      provisionedServices: new Map(),
    });

    retainContainer(state.container, lifecycle);

    if (needsReplacement) {
      const nextSource: SubContainerSource = latestSourceRef.current as SubContainerSource;

      setState({
        container: createContainer(nextSource),
        source: nextSource,
      });
    } else {
      provisionContainer(state.container, lifecycle, state.source.entries);
    }

    return () => scheduleContainerDestruction(state.container, lifecycle);
  }, [needsReplacement, state]);

  return createElement(ContainerReactContext.Provider, { value: state.container }, props.children ?? null);
}
