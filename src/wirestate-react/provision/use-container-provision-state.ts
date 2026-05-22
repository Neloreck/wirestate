import { Container } from "@wirestate/core";
import { useEffect, useRef, useState } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { Optional } from "../types/general";

/**
 * Internal container snapshot managed by provider reconciliation.
 *
 * @internal
 */
export interface ContainerProvisionState<TSource> {
  readonly source: TSource;
  readonly container: Container;
  readonly owned: boolean;
}

/**
 * Reconciliation contract used by provider container state.
 *
 * @internal
 */
interface UseContainerProvisionStateOptions<TSource, TState extends ContainerProvisionState<TSource>> {
  /**
   * Builds a fresh provider state from source.
   */
  readonly create: (source: TSource) => TState;

  /**
   * Checks whether the current state can be reused for the next source.
   */
  readonly reuse: (current: TState, source: TSource, disposed: WeakSet<Container>) => boolean;

  /**
   * Debug prefix used for lifecycle logging.
   */
  readonly label: string;
}

/**
 * Reconciles provider-owned container state and revives it after development cleanup.
 *
 * @internal
 *
 * @param source - Current provider source.
 * @param options - Reconciliation rules.
 * @returns Current provider state.
 */
export function useContainerProvisionState<TSource, TState extends ContainerProvisionState<TSource>>(
  source: TSource,
  options: UseContainerProvisionStateOptions<TSource, TState>
): TState {
  const { create, label, reuse } = options;
  const stateRef = useRef<Optional<TState>>(null);
  const disposedRef = useRef<WeakSet<Container>>(new WeakSet<Container>());
  const [, forceUpdate] = useState<number>(0);

  const current: Optional<TState> = stateRef.current;

  const state: TState =
    current && reuse(current, source, disposedRef.current)
      ? current
      : replaceContainerState(current, source, create, disposedRef.current, label);

  stateRef.current = state;

  useEffect(() => {
    const active: TState = state;

    dbg.info(prefix(__filename), `${label} mounted:`, {
      container: active.container,
      source: active.source,
    });

    if (active.owned && disposedRef.current.has(active.container)) {
      dbg.info(prefix(__filename), `${label} recreating cleaned container:`, {
        container: active.container,
        source: active.source,
      });

      stateRef.current = create(active.source);

      forceUpdate((version: number) => version + 1);
    }

    return () => {
      dbg.info(prefix(__filename), `${label} unmounting:`, {
        container: active.container,
        source: active.source,
      });

      if (active.owned) {
        disposeContainerOnce(active.container, disposedRef.current, label);
      }
    };
  }, [create, label, state]);

  return state;
}

/**
 * Replaces current provider state with a newly created one.
 *
 * @internal
 *
 * @param current - Currently exposed provider state.
 * @param source - Source for next state.
 * @param create - State factory.
 * @param disposed - Set of containers already disposed by this provider.
 * @param label - Debug prefix used for lifecycle logging.
 * @returns Newly created provider state.
 */
function replaceContainerState<TSource, TState extends ContainerProvisionState<TSource>>(
  current: Optional<TState>,
  source: TSource,
  create: (source: TSource) => TState,
  disposed: WeakSet<Container>,
  label: string
): TState {
  if (current?.owned) {
    disposeContainerOnce(current.container, disposed, label);
  }

  return create(source);
}

/**
 * Disposes a provider-owned container once.
 *
 * @internal
 *
 * @param container - Container to dispose.
 * @param disposed - Set of containers already disposed by this provider.
 * @param label - Debug prefix used for lifecycle logging.
 */
function disposeContainerOnce(container: Container, disposed: WeakSet<Container>, label: string): void {
  if (disposed.has(container)) {
    return;
  }

  dbg.info(prefix(__filename), `${label} disposing container:`, {
    container,
  });

  container.unbindAll();

  disposed.add(container);
}
