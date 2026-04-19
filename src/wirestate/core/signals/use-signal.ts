import { Container } from "inversify";
import { MutableRefObject, useEffect, useMemo, useRef } from "react";

import { useContainer } from "@/wirestate/core/provision/use-container";
import { SIGNAL_BUS_TOKEN } from "@/wirestate/core/registry";
import { SignalBus } from "@/wirestate/core/signals/signal-bus";
import type { Maybe, Optional } from "@/wirestate/types/general";
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
  const container: Container = useContainer();

  // todo: Possibility to simplify via separation of useSignals / useSignal functions or narrowing down logics here.

  const isFilter: boolean =
    typeof typeOrHandler === "string" || typeof typeOrHandler === "symbol" || Array.isArray(typeOrHandler);

  const activeHandler: Maybe<TSignalHandler> = isFilter ? maybeHandler : (typeOrHandler as TSignalHandler);

  const handlerRef: MutableRefObject<Maybe<TSignalHandler>> = useRef<Maybe<TSignalHandler>>(activeHandler);

  // Normalize filter to array for efficient inclusion check during emit.
  const types: Optional<ReadonlyArray<TSignalType>> = useMemo(() => {
    if (!isFilter) {
      return null;
    }

    return Array.isArray(typeOrHandler)
      ? (typeOrHandler as ReadonlyArray<TSignalType>)
      : [typeOrHandler as TSignalType];
  }, [typeOrHandler, isFilter]);

  // Sync handler into ref to avoid re-subscriptions on closure changes.
  useEffect(() => {
    handlerRef.current = activeHandler;
  });

  useEffect(() => {
    const bus: SignalBus = container.get<SignalBus>(SIGNAL_BUS_TOKEN);

    return bus.subscribe((signal) => {
      if (types !== null && !types.includes(signal.type)) {
        return;
      }

      handlerRef.current?.(signal);
    });
  }, [container, types]);
}
