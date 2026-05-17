import { Container, createContainer, CreateContainerOptions } from "@wirestate/core";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { ContainerReactContext } from "../context/container-context";
import { shallowEqualArrays } from "../utils/shallow-equal-arrays";

/**
 * Describes how {@link ContainerProvider} receives its root container.
 *
 * @remarks
 * Pass an existing {@link Container} when ownership lives outside React. Pass
 * {@link CreateContainerOptions} when the provider should create and dispose a
 * managed container for the subtree.
 */
type ContainerProviderSource = Container | CreateContainerOptions;

/**
 * Runtime snapshot currently exposed through {@link ContainerReactContext}.
 *
 * @internal
 */
interface ContainerProviderState {
  readonly mode: "external" | "managed";
  readonly container: Container;
  readonly options: CreateContainerOptions;
  readonly value: { value: Container };
  unmounted: boolean;
}

/**
 * Props accepted by {@link ContainerProvider}.
 *
 * @group Provision
 */
export interface ContainerProviderProps {
  /**
   * Container instance or options used to create one.
   *
   * @remarks
   * External container instances are never disposed by this provider. Managed
   * containers created from options are disposed on unmount and recreated when
   * the `entries` array changes by shallow comparison.
   */
  readonly container: ContainerProviderSource;

  /**
   * React subtree that receives the active container.
   */
  readonly children?: ReactNode;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * The provider supports two modes:
 *
 * - External mode: `container` is a prebuilt {@link Container}. The provider
 *   only passes it through context.
 * - Managed mode: `container` is {@link CreateContainerOptions}. The provider
 *   creates a container, owns its disposal, recreates it when `entries` change,
 *   and revives it after React development remount cleanup.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
export function ContainerProvider(props: ContainerProviderProps) {
  const stateRef = useRef<ContainerProviderState | null>(null);
  const disposedRef = useRef<WeakSet<Container>>(new WeakSet<Container>());
  const [, forceUpdate] = useState<number>(0);

  const dispose = (container: Container): void => {
    disposeOnce(container, disposedRef.current);
  };

  const state: ContainerProviderState = reconcileContainerState(stateRef.current, props.container, dispose);

  stateRef.current = state;

  useEffect(() => {
    dbg.info(prefix(__filename), "Provider mounted:", {
      container: state.container,
      mode: state.mode,
    });

    if (reviveManagedContainer(stateRef, disposedRef.current)) {
      forceUpdate((version: number) => version + 1);
    }

    state.unmounted = false;

    return () => {
      dbg.info(prefix(__filename), "Provider unmounting:", {
        container: state.container,
        mode: state.mode,
      });

      if (state.mode === "managed") {
        dispose(state.container);
      }

      state.unmounted = true;
    };
  }, [state]);

  return createElement(ContainerReactContext.Provider, state.value, props.children ?? null);
}

/**
 * Selects the provider state that should be exposed for the current source.
 *
 * @param current - Previously exposed state, if any.
 * @param source - Current container source prop.
 * @param dispose - Idempotent disposal callback for owned containers.
 * @returns Existing or replacement provider state.
 */
function reconcileContainerState(
  current: ContainerProviderState | null,
  source: ContainerProviderSource,
  dispose: (container: Container) => void
): ContainerProviderState {
  if (source instanceof Container) {
    if (current?.mode === "managed") {
      dispose(current.container);
    }

    if (current?.mode === "external" && current.container === source) {
      return current;
    }

    return createContainerState(source);
  }

  if (
    current?.mode === "managed" &&
    !current.unmounted &&
    shallowEqualArrays(source.entries ?? [], current.options.entries ?? [])
  ) {
    return current;
  }

  if (current?.mode === "managed") {
    dispose(current.container);
  }

  return createContainerState(source);
}

/**
 * Creates provider state for an external or managed container source.
 *
 * @param source - Container instance or creation options.
 * @returns Provider state ready for context.
 */
function createContainerState(source: ContainerProviderSource): ContainerProviderState {
  if (source instanceof Container) {
    dbg.info(prefix(__filename), "Constructing for external container:", {
      container: source,
    });

    return {
      mode: "external",
      container: source,
      options: {},
      value: { value: source },
      unmounted: false,
    };
  } else {
    dbg.info(prefix(__filename), "Constructing for managed container:", {
      options: source,
    });

    const container: Container = createContainer(source);

    return {
      mode: "managed",
      container,
      options: source,
      value: { value: container },
      unmounted: false,
    };
  }
}

/**
 * Recreates a managed container that was disposed by development remount cleanup.
 *
 * @param stateRef - Mutable provider state ref.
 * @param stateRef.current - Current provider state.
 * @param disposed - Containers already disposed by this provider.
 * @returns `true` when a fresh container was created.
 */
function reviveManagedContainer(
  stateRef: { current: ContainerProviderState | null },
  disposed: WeakSet<Container>
): boolean {
  const state: ContainerProviderState | null = stateRef.current;

  if (!state || state.mode !== "managed" || !disposed.has(state.container)) {
    return false;
  }

  dbg.info(prefix(__filename), "Provider recreating cleaned container:", {
    container: state.container,
    mode: state.mode,
  });

  stateRef.current = createContainerState(state.options);

  return true;
}

/**
 * Disposes a container once.
 *
 * @param container - Container to dispose.
 * @param disposed - Set of containers already disposed by this provider.
 */
function disposeOnce(container: Container, disposed: WeakSet<Container>): void {
  if (disposed.has(container)) {
    return;
  }

  dbg.info(prefix(__filename), "Provider disposing container:", {
    container,
  });

  container.unbindAll();
  disposed.add(container);
}
