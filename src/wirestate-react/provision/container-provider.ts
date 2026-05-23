import { Container, createContainer, CreateContainerOptions, WirestateError } from "@wirestate/core";
import { createElement, ReactNode, useEffect, useRef, useState } from "react";

import { ContainerReactContext } from "../context/container-context";
import { ERROR_CODE_VALIDATION_ERROR } from "../error/error-code";
import { Optional } from "../types/general";
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
 * Represents props accepted by {@link ContainerProvider}.
 *
 * @group Provision
 */
export interface ContainerProviderProps {
  /**
   * Container instance or options used to create one.
   *
   * @remarks
   * External container instances are never disposed by this provider. Managed
   * containers created from options are disposed on unmount. Managed containers
   * are intentionally recreated only when `parent` or `entries` changes by
   * shallow comparison; inline `seed` and `seeds` values are not treated as
   * recreation signals. Pass a React `key` to force a fresh managed container
   * when those options should be re-applied.
   */
  readonly container: ContainerProviderSource;

  /**
   * React subtree that receives the active container.
   */
  readonly children?: ReactNode;
}

/**
 * Active provider state stored in the component state.
 */
interface ContainerProviderState {
  readonly container: Container;
  readonly source: CreateContainerOptions;
}

/**
 * Provides a root Wirestate container to a React subtree.
 *
 * @remarks
 * Two modes are supported:
 *
 * - External: `container` is a prebuilt {@link Container}. The provider only
 *   passes it through context and never disposes it.
 * - Managed: `container` is {@link CreateContainerOptions}. The provider
 *   creates a container, owns its disposal, and recreates it when `parent` or
 *   `entries` change.
 *
 * @group Provision
 *
 * @param props - Provider props.
 * @returns A React context provider for the active container.
 */
export function ContainerProvider(props: ContainerProviderProps) {
  const source: ContainerProviderSource = props.container;
  const owned: boolean = !(source instanceof Container);
  const ownedRef = useRef<boolean>(owned);
  const pendingDestructionRef = useRef<Optional<Map<Container, ReturnType<typeof setTimeout>>>>(null);

  const [state, setState] = useState<Optional<ContainerProviderState>>(() =>
    owned
      ? { container: createContainer(source as CreateContainerOptions), source: source as CreateContainerOptions }
      : null
  );

  useEffect(() => {
    if (!owned || state === null) {
      return;
    }

    const managedSource: CreateContainerOptions = source as CreateContainerOptions;
    const needsReplacement: boolean =
      state.source.parent !== (source as CreateContainerOptions).parent ||
      !shallowEqualArrays(state.source.entries ?? [], managedSource.entries ?? []);

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

    if (needsReplacement) {
      setState({
        container: createContainer(managedSource),
        source: source as CreateContainerOptions,
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
  }, [
    state,
    owned ? (source as CreateContainerOptions).parent : null,
    owned ? (source as CreateContainerOptions).entries : null,
  ]);

  if (ownedRef.current !== owned) {
    throw new WirestateError(
      ERROR_CODE_VALIDATION_ERROR,
      "ContainerProvider cannot switch between external and managed container modes. Pass a React key to remount the provider."
    );
  }

  return createElement(
    ContainerReactContext.Provider,
    { value: owned ? (state as ContainerProviderState).container : (source as Container) },
    props.children ?? null
  );
}
