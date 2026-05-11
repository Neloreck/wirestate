import { Container, type ServiceIdentifier } from "@wirestate/core";
import { useMemo } from "react";

import { dbg } from "@/macroses/dbg.macro";
import { prefix } from "@/macroses/prefix.macro";

import { AnyObject, Optional } from "../types/general";

import { useIocContext } from "./use-ioc-context";

/**
 * Safely resolves a value from the container, returning a fallback or null if not bound.
 *
 * @remarks
 * Unlike {@link useInjection}, this hook does not throw if the dependency
 * is missing from the container.
 *
 * @group Provision
 *
 * @template T - The type of the value being resolved.
 *
 * @param injectionId - The service identifier (string, symbol, or constructor).
 * @param onFallback - Optional function called to provide a value if the token is not bound.
 *
 * @returns The resolved value, the result of the fallback function, or `null`.
 *
 * @example
 * ```tsx
 * const logger = useOptionalInjection(FileLogger, (container) => container.get(ConsoleLoggerService);
 * ```
 */
export function useOptionalInjection<T>(
  injectionId: ServiceIdentifier<T>,
  onFallback?: (container: Container) => T
): Optional<T> {
  const { container, revision } = useIocContext();

  // Revision bump forces a container reset; force re-resolution to drop stale instances.
  return useMemo(() => {
    if (container.isBound(injectionId)) {
      dbg.info(prefix(__filename), "Resolving injection:", {
        token: injectionId,
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return container.get<T>(injectionId);
    } else if (onFallback) {
      dbg.info(prefix(__filename), "Injection not found, using fallback handler:", {
        token: injectionId,
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return onFallback(container);
    } else {
      dbg.info(prefix(__filename), "Injection not found, returning null:", {
        token: injectionId,
        name: (injectionId as AnyObject)?.name ?? injectionId,
        revision,
        container,
        onFallback,
      });

      return null;
    }
  }, [container, revision, injectionId]);
}
