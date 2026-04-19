import { Container } from "inversify";
import { useEffect, useMemo, useRef } from "react";

import { useIocContext } from "@/wirestate/core/provision/use-ioc-context";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { TSignalHandler, TSignalType } from "@/wirestate/types/signals";

export function useSignal(handler: TSignalHandler): void;
export function useSignal(type: TSignalType | ReadonlyArray<TSignalType>, handler: TSignalHandler): void;

/**
 * Subscribes a component to signals.
 *
 * @param typeOrHandler - signal type(s) to filter by, or the handler itself
 * @param maybeHandler - signal handler if a filter is provided
 */
export function useSignal(
  typeOrHandler: TSignalType | ReadonlyArray<TSignalType> | TSignalHandler,
  maybeHandler?: TSignalHandler
): void {
  const container: Container = useIocContext().container;

  const isFilter: boolean =
    typeof typeOrHandler === "string" || typeof typeOrHandler === "symbol" || Array.isArray(typeOrHandler);

  const activeHandler = isFilter ? maybeHandler : (typeOrHandler as TSignalHandler);

  // Normalize filter to array for efficient inclusion check during emit.
  const types = useMemo<ReadonlyArray<TSignalType> | null>(() => {
    if (!isFilter) {
      return null;
    }

    if (Array.isArray(typeOrHandler)) {
      return typeOrHandler as ReadonlyArray<TSignalType>;
    }

    return [typeOrHandler as TSignalType];
  }, [typeOrHandler, isFilter]);

  const handlerRef = useRef<TSignalHandler | undefined>(activeHandler);

  // Sync handler into ref to avoid re-subscriptions on closure changes.
  useEffect(() => {
    handlerRef.current = activeHandler;
  });

  useEffect(() => {
    const bus = container.get<SignalBus>(SIGNAL_BUS_TOKEN);

    return bus.subscribe((signal) => {
      if (types !== null && !types.includes(signal.type)) {
        return;
      }

      handlerRef.current?.(signal);
    });
  }, [container, types]);
}
