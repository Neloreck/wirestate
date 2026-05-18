import { Container, createContainer, SeedEntries } from "@wirestate/core";
import { InjectableEntries } from "@wirestate/core/types/provision";
import { createElement, type ReactNode } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerReactContext } from "../context/container-context";
import { useContainer } from "../context/use-container";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

import { ContainerProvisionState, useContainerProvisionState } from "./use-container-provision-state";

/**
 * Runtime snapshot currently exposed by {@link SubContainerProvider}.
 *
 * @internal
 */
type SubContainerState = ContainerProvisionState<SubContainerSource>;

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

  const source: SubContainerSource = {
    entries: props.entries,
    parent,
    seeds: props.seeds,
  };

  const state: SubContainerState = useContainerProvisionState(source, {
    create: createSubContainerState,
    label: "SubContainerProvider",
    reuse: canReuseSubContainerState,
  });

  return createElement(ContainerReactContext.Provider, { value: state.container }, props.children ?? null);
}

/**
 * Selects the child-container state that should be exposed for this render.
 *
 * @param current - Previously exposed state, if any.
 * @param source - Current provider source.
 * @param disposed - Child containers already disposed by this provider.
 * @returns Existing or replacement child-container state.
 */
function canReuseSubContainerState(
  current: SubContainerState,
  source: SubContainerSource,
  disposed: WeakSet<Container>
): boolean {
  return (
    !disposed.has(current.container) &&
    current.source.parent === source.parent &&
    shallowEqualArrays(source.entries, current.source.entries)
  );
}

/**
 * Creates a child container, applies seeds, and binds entries.
 *
 * @param source - Parent container plus child bindings.
 * @returns Child-container state ready for context.
 */
function createSubContainerState(source: SubContainerSource): SubContainerState {
  const container: Container = createContainer({
    entries: source.entries,
    parent: source.parent,
    seeds: source.seeds,
  });

  dbg.info(prefix(__filename), "Constructing new container state:", {
    parent: source.parent,
    container,
    seeds: source.seeds,
    entries: source.entries,
  });

  return {
    source,
    container,
    owned: true,
  };
}
